"use client"

/**
 * Compose Email modal — Contact > Communication tab. v1 is outbound only;
 * reply / inbound threading lands later (see CommunicationTab comment).
 *
 * Form fields: subject, cc, bcc, body, attachments. `to` is intentionally
 * NOT editable — the recipient is the contact's email on file, resolved
 * server-side so the form can't redirect the send.
 *
 * Attachment flow mirrors the in-portal composer:
 *   1. Pick + validate against ALLOWED_MIME_TYPES / MAX_FILE_BYTES
 *   2. presignContactDocumentUploads → PUT to MinIO
 *   3. sendContactEmail with the keys; server HEADs + pulls bytes + sends.
 */
import { useRef, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Modal, Field, inputStyle } from "@/modules/users/components/modal"
import { Button, IconButton } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
  isAllowedMimeType,
} from "@/lib/upload-limits"
import { presignContactDocumentUploads } from "@/modules/contact-documents/actions"
import { sendContactEmail } from "@/modules/communications/actions"

/** Split a textarea blob of addresses on commas/newlines/whitespace. */
function parseAddressList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function ComposeEmailModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  contactEmail,
}: {
  isOpen: boolean
  onClose: () => void
  contactId: string
  contactName: string
  contactEmail: string | null
}) {
  const router = useRouter()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [subject, setSubject] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"subject" | "body" | "cc" | "bcc", string>>
  >({})

  const reset = () => {
    setSubject("")
    setCc("")
    setBcc("")
    setBody("")
    setFiles([])
    setFieldErrors({})
  }

  const close = () => {
    if (sending) return
    reset()
    onClose()
  }

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!picked.length) return
    const merged = [...files]
    for (const f of picked) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) {
        merged.push(f)
      }
    }
    if (merged.length > MAX_BULK_FILES) {
      toast.warn({
        title: "Too many files",
        message: `Attach up to ${MAX_BULK_FILES} files per email.`,
      })
      return
    }
    for (const f of merged) {
      if (!isAllowedMimeType(f.type)) {
        toast.error({
          title: "File type not supported",
          message: `${f.name} isn't a file type we accept.`,
        })
        return
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error({
          title: "File too large",
          message: `${f.name} is over ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB.`,
        })
        return
      }
    }
    setFiles(merged)
  }

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleSend = async () => {
    setFieldErrors({})
    if (!contactEmail) {
      toast.error({
        title: "No email address",
        message:
          "This contact has no email on file. Add one on the Profile tab first.",
      })
      return
    }
    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    if (!trimmedSubject) {
      setFieldErrors((e) => ({ ...e, subject: "Add a subject" }))
      return
    }
    if (!trimmedBody) {
      setFieldErrors((e) => ({ ...e, body: "Write a message" }))
      return
    }

    setSending(true)
    try {
      // 1) Presign + PUT each attachment to MinIO before persisting the email.
      let attachments:
        | {
            key: string
            fileName: string
            mimeType: string
            sizeBytes: number
          }[]
        | undefined

      if (files.length > 0) {
        const presignRes = await presignContactDocumentUploads({
          contactId,
          files: files.map((f) => ({
            fileName: f.name,
            mimeType: f.type,
            sizeBytes: f.size,
          })),
        })
        if (!presignRes.ok) {
          toast.error({
            title: "Couldn't attach files",
            message: presignRes.error.message,
          })
          return
        }
        await Promise.all(
          presignRes.data.map(async (slot, i) => {
            const file = files[i]!
            const res = await fetch(slot.uploadUrl, {
              method: "PUT",
              headers: slot.headers,
              body: file,
            })
            if (!res.ok) {
              throw new Error(`Upload failed for ${file.name} (${res.status})`)
            }
          }),
        )
        attachments = presignRes.data.map((slot) => ({
          key: slot.key,
          fileName: slot.fileName,
          mimeType: slot.mimeType,
          sizeBytes: slot.sizeBytes,
        }))
      }

      const ccList = parseAddressList(cc)
      const bccList = parseAddressList(bcc)

      const res = await sendContactEmail({
        contactId,
        subject: trimmedSubject,
        body: trimmedBody,
        cc: ccList.length ? ccList : undefined,
        bcc: bccList.length ? bccList : undefined,
        attachments,
      })

      if (!res.ok) {
        if (res.error.fields) {
          setFieldErrors({
            subject: res.error.fields.subject?.[0],
            body: res.error.fields.body?.[0],
            cc: res.error.fields.cc?.[0],
            bcc: res.error.fields.bcc?.[0],
          })
        }
        toast.error({
          title: "Couldn't send email",
          message: res.error.message,
        })
        return
      }

      toast.success({
        title: "Email sent",
        message: `Delivered to ${contactName}.`,
      })
      reset()
      onClose()
      router.refresh()
    } catch (e) {
      toast.error({
        title: "Couldn't send email",
        message: e instanceof Error ? e.message : "Try again in a moment.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close}>
      <div style={{ padding: "22px 24px 6px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 24,
            letterSpacing: "var(--tight)",
            margin: 0,
          }}
        >
          Compose <em style={{ fontStyle: "italic" }}>Email</em>
        </h2>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-faint)",
            marginTop: 6,
            letterSpacing: "var(--tracked)",
          }}
        >
          To {contactName} · {contactEmail ?? "no email on file"}
        </div>
      </div>

      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: "65vh",
          overflowY: "auto",
        }}
      >
        <Field label="Subject" error={fieldErrors.subject}>
          <input
            style={inputStyle}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A short, specific subject line"
            disabled={sending}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Cc" error={fieldErrors.cc}>
            <input
              style={inputStyle}
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="email@example.com, email2@…"
              disabled={sending}
            />
          </Field>
          <Field label="Bcc" error={fieldErrors.bcc}>
            <input
              style={inputStyle}
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="email@example.com"
              disabled={sending}
            />
          </Field>
        </div>

        <Field label="Body" error={fieldErrors.body}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            disabled={sending}
            style={{
              ...inputStyle,
              height: "auto",
              padding: "10px 12px",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 180,
            }}
          />
        </Field>

        <Field label={`Attachments (${files.length}/${MAX_BULK_FILES})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(",")}
              hidden
              onChange={onPickFiles}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                alignSelf: "flex-start",
                padding: "8px 14px",
                borderRadius: "var(--r-2)",
                border: "1px dashed var(--line-strong)",
                background: "transparent",
                color: "var(--ink)",
                font: "inherit",
                fontSize: 12.5,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              <Icon name="Plus" size={13} /> Add attachments
            </button>
            {files.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {files.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px 4px 10px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--shell)",
                      border: "1px solid var(--line-soft)",
                      fontSize: 11,
                      maxWidth: 260,
                    }}
                    title={f.name}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.name}
                    </span>
                    <IconButton
                      size={20}
                      variant="quiet"
                      title="Remove"
                      onClick={() => removeFile(i)}
                    >
                      <Icon name="X" size={10} />
                    </IconButton>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Field>
      </div>

      <div
        style={{
          padding: "14px 24px 22px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <Button variant="ghost" type="button" onClick={close} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={handleSend}
          disabled={sending || !contactEmail}
          iconRight={<Icon name="ArrowRight" size={14} />}
        >
          {sending ? "Sending…" : "Send email"}
        </Button>
      </div>
    </Modal>
  )
}
