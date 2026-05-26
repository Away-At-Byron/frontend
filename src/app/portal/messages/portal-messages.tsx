"use client"

/**
 * Contact-portal chat view. Mirrors the staff Communication tab but with
 * "me" = the signed-in contact (their bubbles sit on the right, staff on the
 * left). Same `messages` table, same attachment flow — only the sender side
 * and the action endpoint differ.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { useRouter } from "next/navigation"
import { Button, Card, IconButton } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
  isAllowedMimeType,
} from "@/lib/upload-limits"
import {
  getContactDocumentDownloadUrlAction,
  presignContactDocumentUploadsAsContact,
} from "@/modules/contact-documents/actions"
import { sendMessageAsContact } from "@/modules/communications/actions"
import type {
  MessageAttachment,
  MessageRow,
} from "@/modules/communications/types"

export function PortalMessages({
  messages,
  contactName,
  errorMessage,
}: {
  messages: MessageRow[]
  contactName: string | null
  errorMessage: string | null
}) {
  const headline = useMemo(() => {
    if (messages.length === 0) return "No messages yet — say hello below."
    const last = messages[messages.length - 1]!
    return `${messages.length} ${messages.length === 1 ? "message" : "messages"} · last ${formatBubbleTime(last.createdAt)}`
  }, [messages])

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--linen)",
        padding: "32px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span className="caps" style={{ color: "var(--ink-faint)", fontSize: 10 }}>
            Portal
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 300,
              fontSize: 32,
              letterSpacing: "var(--tight)",
              margin: 0,
            }}
          >
            Messages
          </h1>
          <p
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              margin: 0,
              letterSpacing: ".04em",
            }}
          >
            {contactName ? `${contactName} · ` : ""}
            {headline}
          </p>
        </header>

        {errorMessage && (
          <Card pad={16} style={{ background: "var(--terra-soft, #fbe8e0)", color: "#A8624B" }}>
            Couldn&apos;t load your messages. {errorMessage}
          </Card>
        )}

        <Card
          pad={0}
          style={{
            display: "flex",
            flexDirection: "column",
            // Reserve a chunk of viewport for the thread + composer so the
            // bubbles get a scroll container of their own.
            height: "min(72vh, 700px)",
            overflow: "hidden",
          }}
        >
          <Thread messages={messages} />
          <Composer />
        </Card>
      </div>
    </div>
  )
}

// ─── Thread ──────────────────────────────────────────────────

function Thread({ messages }: { messages: MessageRow[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          color: "var(--ink-faint)",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontSize: 16,
          textAlign: "center",
        }}
      >
        Send the first message to start a thread with the team.
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        minHeight: 0,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}
    >
      {messages.map((m) => (
        <Bubble key={m.id} m={m} />
      ))}
    </div>
  )
}

function Bubble({ m }: { m: MessageRow }) {
  // Contact portal: my own messages sit on the right.
  const me = m.senderType === "contact"
  const author = m.senderName ?? (me ? "You" : "Staff")
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: me ? "flex-end" : "flex-start",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 9,
          marginBottom: 3,
          marginLeft: me ? 0 : 10,
          marginRight: me ? 10 : 0,
        }}
      >
        {author} · {formatBubbleTime(m.createdAt)}
      </div>
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          fontSize: 13.5,
          lineHeight: 1.45,
          background: me ? "var(--ink)" : "var(--paper)",
          color: me ? "var(--linen)" : "var(--ink)",
          border: me ? "none" : "1px solid var(--line)",
          borderRadius: me ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {m.body}
        {m.attachments.length > 0 && (
          <AttachmentStrip attachments={m.attachments} me={me} />
        )}
      </div>
    </div>
  )
}

function AttachmentStrip({
  attachments,
  me,
}: {
  attachments: MessageAttachment[]
  me: boolean
}) {
  const images = attachments.filter(
    (a) => a.previewUrl && a.mimeType?.startsWith("image/"),
  )
  const files = attachments.filter(
    (a) => !a.previewUrl || !a.mimeType?.startsWith("image/"),
  )
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              images.length === 1
                ? "180px"
                : `repeat(${Math.min(images.length, 3)}, 1fr)`,
            gap: 5,
          }}
        >
          {images.map((a) => (
            <a
              key={a.id}
              href={a.previewUrl!}
              target="_blank"
              rel="noopener"
              style={{
                aspectRatio: "1",
                borderRadius: "var(--r-2)",
                background: "var(--shell)",
                border: "1px solid var(--line-soft)",
                overflow: "hidden",
                display: "block",
              }}
              title={a.fileName ?? "Image"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.previewUrl!}
                alt={a.fileName ?? "attachment"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </a>
          ))}
        </div>
      )}
      {files.map((a) => (
        <FileChip key={a.id} attachment={a} me={me} />
      ))}
    </div>
  )
}

function FileChip({
  attachment,
  me,
}: {
  attachment: MessageAttachment
  me: boolean
}) {
  const toast = useToast()
  const [opening, setOpening] = useState(false)
  const openFile = async () => {
    setOpening(true)
    const res = await getContactDocumentDownloadUrlAction(attachment.id)
    setOpening(false)
    if (!res.ok) {
      toast.error({
        title: "Couldn't open attachment",
        message: res.error.message,
      })
      return
    }
    window.open(res.data.url, "_blank", "noopener")
  }
  return (
    <button
      type="button"
      onClick={openFile}
      disabled={opening}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: "var(--r-1)",
        background: me ? "rgba(255,255,255,0.10)" : "var(--shell)",
        border: me ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--line-soft)",
        color: "inherit",
        font: "inherit",
        fontSize: 11.5,
        cursor: opening ? "wait" : "pointer",
        maxWidth: "100%",
      }}
      title={attachment.fileName ?? "Attachment"}
    >
      <Icon name="Edit" size={12} />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {attachment.fileName ?? "Attachment"}
      </span>
      <span style={{ opacity: 0.6, fontSize: 10 }}>
        {formatChipSize(attachment.sizeBytes)}
      </span>
    </button>
  )
}

function formatChipSize(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatBubbleTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const time = d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  if (sameDay) return `today ${time}`
  const date = d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  })
  return `${date} · ${time}`
}

// ─── Composer ───────────────────────────────────────────────

function Composer() {
  const router = useRouter()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  const canSend = !sending && body.trim().length > 0

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
        message: `Attach up to ${MAX_BULK_FILES} files per message.`,
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

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setSending(true)
    try {
      let attachments:
        | { key: string; fileName: string; mimeType: string; sizeBytes: number }[]
        | undefined = undefined

      if (files.length > 0) {
        const presignRes = await presignContactDocumentUploadsAsContact({
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
        const uploads = await Promise.all(
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
            return slot
          }),
        )
        attachments = uploads.map((slot) => ({
          key: slot.key,
          fileName: slot.fileName,
          mimeType: slot.mimeType,
          sizeBytes: slot.sizeBytes,
        }))
      }

      const res = await sendMessageAsContact({
        body: trimmed,
        attachments,
      })

      if (!res.ok) {
        toast.error({
          title: "Couldn't send message",
          message: res.error.message,
        })
        return
      }

      setBody("")
      setFiles([])
      router.refresh()
    } catch (err) {
      toast.error({
        title: "Couldn't send message",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--line-soft)",
        padding: "14px 18px",
        background: "var(--linen, var(--shell))",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Write a message…"
        disabled={sending}
        rows={2}
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-2)",
          padding: "10px 12px",
          fontSize: 13.5,
          color: "var(--ink)",
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: 60,
          width: "100%",
          boxSizing: "border-box",
        }}
      />

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
                maxWidth: 220,
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

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          aria-label="Attach files"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-1)",
            border: "1px dashed var(--line-strong)",
            background: "transparent",
            cursor: sending ? "not-allowed" : "pointer",
            color: "var(--ink-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="Plus" size={14} />
        </button>
        <span style={{ flex: 1 }} />
        <Button
          variant="primary"
          size="sm"
          iconRight={<Icon name="ArrowRight" size={13} />}
          onClick={handleSend}
          disabled={!canSend}
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  )
}
