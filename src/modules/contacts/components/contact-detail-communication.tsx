"use client";

/**
 * Communication tab — 4-quadrant layout ported from
 * `docs/design-reference/contact-details.jsx`. In-portal messages and Emails
 * are wired to real data (messages/conversations schema and contact_emails
 * respectively); Emails are outbound-only in v1 — reply / inbound threading
 * lands once the rest of the build is complete (per CLAUDE.md scope notes).
 * SMS stays on mock data until the Twilio integration lands (mandatory,
 * scheduled late). Notes & Preferences are bound to the live form fields.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
  isAllowedMimeType,
} from "@/lib/upload-limits";
import {
  presignContactDocumentUploads,
  getContactDocumentDownloadUrlAction,
} from "@/modules/contact-documents/actions";
import { sendMessage } from "@/modules/communications/actions";
import type {
  ContactEmailRow,
  MessageAttachment,
  MessageRow,
} from "@/modules/communications/types";
import { ComposeEmailModal } from "./compose-email-modal";
import { Modal } from "@/modules/users/components/modal";
import type { FormState, OnField } from "./contact-detail-form";
import { Row, Textarea, TextInput } from "./contact-detail-fields";

// ─── Mock data (SMS quadrant — Twilio integration is scheduled late) ────

type MockChatMessage = {
  who: "guest" | "staff";
  t: string;
  text: string;
  author?: string;
  photos?: string[];
};

const SMS_MESSAGES: MockChatMessage[] = [
  {
    who: "staff",
    t: "18 Nov · 19:02",
    text: "Booking R-5453 confirmed. Reply STOP to opt out.",
    author: "System",
  },
  {
    who: "guest",
    t: "19 Nov · 11:25",
    text: "Flight landing 10pm Tue — late check-in OK?",
  },
  {
    who: "staff",
    t: "19 Nov · 11:32",
    text: "No problem. Keys in lockbox, code 4421. Sending a photo of the gate.",
    author: "Mia",
    photos: ["gate"],
  },
  {
    who: "guest",
    t: "19 Nov · 11:36",
    text: "Perfect — thanks!",
  },
  {
    who: "staff",
    t: "20 Nov · 09:00",
    text: "Reminder: arrival tomorrow. Anything we should prep?",
    author: "System",
  },
];

// ─── Tab ─────────────────────────────────────────────────────

export function CommunicationTab({
  form,
  onField,
  contactId,
  contactName,
  contactEmail,
  messages,
  emails,
}: {
  form: FormState;
  onField: OnField;
  contactId: string | null;
  contactName: string;
  contactEmail: string | null;
  messages: MessageRow[];
  emails: ContactEmailRow[];
}) {
  const portalMeta = useMemo(() => {
    if (messages.length === 0) return undefined;
    const last = messages[messages.length - 1]!;
    const when = formatBubbleTime(last.createdAt);
    return `${messages.length} ${messages.length === 1 ? "message" : "messages"} · last ${when}`;
  }, [messages]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [openEmail, setOpenEmail] = useState<ContactEmailRow | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <Quadrant
        icon="Message"
        iconBg="rgba(157,201,196,.32)"
        iconFg="var(--teal-ink)"
        title="App Messages"
        footer={<PortalComposer contactId={contactId} meta={portalMeta} />}
      >
        <PortalThread messages={messages} contactId={contactId} />
      </Quadrant>

      <Quadrant
        icon="Edit"
        iconBg="rgba(232,183,158,.42)"
        iconFg="var(--terra-deep)"
        title="Emails"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-faint)" }}
            >
              {contactEmail ? `To ${contactEmail}` : "No email on Profile"}
            </span>
            <Button
              variant="primary"
              iconRight={<Icon name="ArrowRight" size={14} />}
              onClick={() => setComposeOpen(true)}
              disabled={!contactId || !contactEmail}
            >
              Compose email
            </Button>
          </div>
        }
      >
        <EmailList
          emails={emails}
          contactId={contactId}
          onOpen={setOpenEmail}
        />
      </Quadrant>

      {contactId && (
        <ComposeEmailModal
          isOpen={composeOpen}
          onClose={() => setComposeOpen(false)}
          contactId={contactId}
          contactName={contactName}
          contactEmail={contactEmail}
        />
      )}

      <EmailViewerModal email={openEmail} onClose={() => setOpenEmail(null)} />

      <Quadrant
        icon="Bell"
        iconBg="rgba(199,126,99,.20)"
        iconFg="var(--terra-deep)"
        title="SMS messages"
        sub={form.phone || "No phone on Profile"}
        footer={
          <Composer
            placeholder="Reply via SMS…"
            meta={`${SMS_MESSAGES.length} messages · charges A$0.06 / msg`}
          />
        }
      >
        <ChatThread messages={SMS_MESSAGES} />
      </Quadrant>

      <Quadrant
        icon="Sparkles"
        iconBg="rgba(110,155,151,.18)"
        iconFg="var(--teal-ink)"
        title="Notes & Preferences"
      >
        <NotesAndPreferences form={form} onField={onField} />
      </Quadrant>
    </div>
  );
}

// ─── Notes & Preferences (live form) ─────────────────────────

function NotesAndPreferences({
  form,
  onField,
}: {
  form: FormState;
  onField: OnField;
}) {
  const onText =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onField(key)({
        target: { value: e.target.value },
      } as React.ChangeEvent<HTMLInputElement>);

  return (
    <div>
      <Row label="Notes">
        <Textarea value={form.notes} onChange={onText("notes")} rows={3} />
      </Row>
      {/* System-derived: earliest booking date for this guest. Disabled
          until the Booking module lands (FRS §6.5); the stored value is shown
          read-only in the meantime. */}
      <Row label="First booking">
        <TextInput value={form.firstBookingDate} disabled />
      </Row>
      <Row label="Special requests">
        <Textarea
          value={form.specialRequests}
          onChange={onText("specialRequests")}
          rows={3}
        />
      </Row>
      <Row label="Accessibility">
        <Textarea
          value={form.accessibilityRequirements}
          onChange={onText("accessibilityRequirements")}
          rows={3}
        />
      </Row>
    </div>
  );
}

// ─── In-portal chat (real, backed by messages/conversations) ────

/**
 * Real message thread for the in-portal Communication quadrant. Auto-scrolls
 * to the latest message on mount and whenever new messages land. Empty state
 * tells staff that the contact hasn't started a thread yet, or prompts them
 * to send the first message.
 */
function PortalThread({
  messages,
  contactId,
}: {
  messages: MessageRow[];
  contactId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          padding: "40px 22px",
          textAlign: "center",
          color: "var(--ink-faint)",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontSize: 16,
        }}
      >
        {contactId
          ? "No messages yet. Send the first one below."
          : "Save the contact first, then start a conversation."}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        height: "100%",
      }}
    >
      {messages.map((m) => (
        <PortalBubble key={m.id} m={m} />
      ))}
    </div>
  );
}

function PortalBubble({ m }: { m: MessageRow }) {
  const me = m.senderType === "user";
  const author = m.senderName ?? (me ? "Staff" : "Guest");
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
          fontSize: 8.5,
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
          padding: "9px 13px",
          fontSize: 12.5,
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
  );
}

function AttachmentStrip({
  attachments,
  me,
}: {
  attachments: MessageAttachment[];
  me: boolean;
}) {
  const images = attachments.filter(
    (a) => a.previewUrl && a.mimeType?.startsWith("image/"),
  );
  const files = attachments.filter(
    (a) => !a.previewUrl || !a.mimeType?.startsWith("image/"),
  );

  return (
    <div
      style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}
    >
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              images.length === 1
                ? "160px"
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
  );
}

function FileChip({
  attachment,
  me,
}: {
  attachment: MessageAttachment;
  me: boolean;
}) {
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  const openFile = async () => {
    setOpening(true);
    const res = await getContactDocumentDownloadUrlAction(attachment.id);
    setOpening(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't open attachment",
        message: res.error.message,
      });
      return;
    }
    window.open(res.data.url, "_blank", "noopener");
  };
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
        border: me
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid var(--line-soft)",
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
  );
}

function formatChipSize(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Concise timestamp for chat bubbles — "today 14:32" / "20 Nov · 09:14". */
function formatBubbleTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (sameDay) return `today ${time}`;
  const date = d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
  return `${date} · ${time}`;
}

// ─── Portal composer (real send + multi-file attachments) ────

function PortalComposer({
  contactId,
  meta,
}: {
  contactId: string | null;
  meta?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const canSend = contactId !== null && !sending && body.trim().length > 0;

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    // Merge + de-dupe with current selection so the user can add from multiple
    // folders. Same heuristic as the Documents-tab upload dialog.
    const merged = [...files];
    for (const f of picked) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) {
        merged.push(f);
      }
    }
    if (merged.length > MAX_BULK_FILES) {
      toast.warn({
        title: "Too many files",
        message: `Attach up to ${MAX_BULK_FILES} files per message.`,
      });
      return;
    }
    for (const f of merged) {
      if (!isAllowedMimeType(f.type)) {
        toast.error({
          title: "File type not supported",
          message: `${f.name} isn't a file type we accept.`,
        });
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error({
          title: "File too large",
          message: `${f.name} is over ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB.`,
        });
        return;
      }
    }
    setFiles(merged);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!contactId) return;
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      // 1) If attachments, presign + PUT each before persisting the message.
      let attachments: {
        key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
      }[] = [];

      if (files.length > 0) {
        const presignRes = await presignContactDocumentUploads({
          contactId,
          files: files.map((f) => ({
            fileName: f.name,
            mimeType: f.type,
            sizeBytes: f.size,
          })),
        });
        if (!presignRes.ok) {
          toast.error({
            title: "Couldn't attach files",
            message: presignRes.error.message,
          });
          return;
        }
        const uploads = await Promise.all(
          presignRes.data.map(async (slot, i) => {
            const file = files[i]!;
            const res = await fetch(slot.uploadUrl, {
              method: "PUT",
              headers: slot.headers,
              body: file,
            });
            if (!res.ok) {
              throw new Error(`Upload failed for ${file.name} (${res.status})`);
            }
            return slot;
          }),
        );
        attachments = uploads.map((slot) => ({
          key: slot.key,
          fileName: slot.fileName,
          mimeType: slot.mimeType,
          sizeBytes: slot.sizeBytes,
        }));
      }

      // 2) Persist the message + (optionally) link the attachment rows.
      const sendRes = await sendMessage({
        contactId,
        body: trimmed,
        attachments: attachments.length ? attachments : undefined,
      });

      if (!sendRes.ok) {
        toast.error({
          title: "Couldn't send message",
          message: sendRes.error.message,
        });
        return;
      }

      // Reset composer + refresh so the new bubble appears.
      setBody("");
      setFiles([]);
      router.refresh();
    } catch (err) {
      toast.error({
        title: "Couldn't send message",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter to send — matches Slack/etc., keeps newline on plain Enter.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={
          contactId
            ? "Reply or send new message"
            : "Save the contact first to start a conversation."
        }
        disabled={!contactId || sending}
        rows={2}
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-2)",
          padding: "10px 12px",
          fontSize: 12.5,
          color: "var(--ink)",
          fontFamily: "inherit",
          resize: "vertical",
          minHeight: 56,
          width: "100%",
          boxSizing: "border-box",
        }}
      />

      {files.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
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
          aria-label="Attach images"
          onClick={() => fileInputRef.current?.click()}
          disabled={!contactId || sending}
          style={{
            height: 36,
            padding: "0 12px 0 10px",
            borderRadius: "var(--r-1)",
            border: "1px dashed var(--line-strong)",
            background: "transparent",
            cursor: !contactId || sending ? "not-allowed" : "pointer",
            color: "var(--ink-faint)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontFamily: "inherit",
          }}
        >
          <Icon name="Plus" size={14} />
          <span>Images</span>
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
      {meta && (
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--ink-faint)" }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

// ─── Chat thread (mock, used by SMS quadrant) ────────────────

function ChatThread({ messages }: { messages: MockChatMessage[] }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {messages.map((m, i) => (
        <ChatBubble key={i} m={m} />
      ))}
    </div>
  );
}

function ChatBubble({ m }: { m: MockChatMessage }) {
  const me = m.who === "staff";
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
          fontSize: 8.5,
          marginBottom: 3,
          marginLeft: me ? 0 : 10,
          marginRight: me ? 10 : 0,
        }}
      >
        {me ? (m.author ?? "Staff") : "Guest"} · {m.t}
      </div>
      <div
        style={{
          maxWidth: "82%",
          padding: "9px 13px",
          fontSize: 12.5,
          lineHeight: 1.45,
          background: me ? "var(--ink)" : "var(--paper)",
          color: me ? "var(--linen)" : "var(--ink)",
          border: me ? "none" : "1px solid var(--line)",
          borderRadius: me ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        }}
      >
        {m.text}
        {m.photos && (
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns:
                m.photos.length === 1
                  ? "120px"
                  : `repeat(${Math.min(m.photos.length, 3)}, 1fr)`,
              gap: 5,
            }}
          >
            {m.photos.map((id, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "var(--r-2)",
                  background: "var(--shell-deep, var(--shell))",
                  border: "1px solid var(--line-soft)",
                  color: "var(--ink-faint)",
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textTransform: "capitalize",
                }}
              >
                {id}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Email list ──────────────────────────────────────────────

function EmailList({
  emails,
  contactId,
  onOpen,
}: {
  emails: ContactEmailRow[];
  contactId: string | null;
  onOpen: (email: ContactEmailRow) => void;
}) {
  if (emails.length === 0) {
    return (
      <div
        style={{
          padding: "40px 22px",
          textAlign: "center",
          color: "var(--ink-faint)",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontSize: 16,
        }}
      >
        {contactId
          ? "No emails sent yet. Use Compose email below."
          : "Save the contact first, then send an email."}
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {emails.map((e) => {
        const tone =
          e.status === "sent"
            ? "ok"
            : e.status === "failed"
              ? "bad"
              : "neutral";
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onOpen(e)}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--r-2)",
              background: "var(--paper)",
              border: "1px solid var(--line-soft)",
              display: "flex",
              flexDirection: "column",
              gap: 5,
              textAlign: "left",
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pill tone={tone} size="sm">
                {e.status === "sent"
                  ? "Sent"
                  : e.status === "failed"
                    ? "Failed"
                    : "Queued"}
              </Pill>
              {e.attachmentCount > 0 && (
                <Pill tone="paper" size="sm">
                  {e.attachmentCount}{" "}
                  {e.attachmentCount === 1 ? "file" : "files"}
                </Pill>
              )}
              {e.sentByName && (
                <span
                  className="mono"
                  style={{ fontSize: 10, color: "var(--ink-faint)" }}
                >
                  by {e.sentByName}
                </span>
              )}
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  marginLeft: "auto",
                }}
              >
                {formatBubbleTime(e.sentAt ?? e.createdAt)}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 14.5,
                fontWeight: 400,
              }}
            >
              {e.subject}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {e.bodyText}
            </div>
            {e.status === "failed" && e.errorMessage && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--bad-fg, var(--terra-deep))",
                  marginTop: 2,
                }}
              >
                {e.errorMessage}
              </div>
            )}
            {(e.ccAddresses.length > 0 || e.bccAddresses.length > 0) && (
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  marginTop: 2,
                }}
              >
                {e.ccAddresses.length > 0 && `cc ${e.ccAddresses.join(", ")}`}
                {e.ccAddresses.length > 0 && e.bccAddresses.length > 0 && " · "}
                {e.bccAddresses.length > 0 &&
                  `bcc ${e.bccAddresses.join(", ")}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Email viewer ────────────────────────────────────────────

function EmailViewerModal({
  email,
  onClose,
}: {
  email: ContactEmailRow | null;
  onClose: () => void;
}) {
  if (!email) return null;
  const sentLabel = formatBubbleTime(email.sentAt ?? email.createdAt);
  return (
    <Modal isOpen={!!email} onClose={onClose}>
      <div
        style={{
          maxHeight: "calc(100vh - 128px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "22px 24px 6px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 300,
              fontSize: 22,
              letterSpacing: "var(--tight)",
              margin: 0,
            }}
          >
            {email.subject || "(no subject)"}
          </h2>
        </div>
        <div
          style={{
            padding: "10px 24px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
            color: "var(--ink-soft)",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <div>
            <span style={{ color: "var(--ink-faint)" }}>From </span>
            {email.fromAddress}
            {email.sentByName ? ` · ${email.sentByName}` : ""}
          </div>
          <div>
            <span style={{ color: "var(--ink-faint)" }}>To </span>
            {email.toAddresses.join(", ")}
          </div>
          {email.ccAddresses.length > 0 && (
            <div>
              <span style={{ color: "var(--ink-faint)" }}>Cc </span>
              {email.ccAddresses.join(", ")}
            </div>
          )}
          {email.bccAddresses.length > 0 && (
            <div>
              <span style={{ color: "var(--ink-faint)" }}>Bcc </span>
              {email.bccAddresses.join(", ")}
            </div>
          )}
          <div
            className="mono"
            style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}
          >
            {sentLabel} · {email.status}
            {email.attachmentCount > 0
              ? ` · ${email.attachmentCount} ${
                  email.attachmentCount === 1 ? "file" : "files"
                }`
              : ""}
          </div>
        </div>
        <div
          style={{
            padding: "16px 24px",
            overflow: "auto",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--ink)",
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}
        >
          {email.bodyText}
        </div>
        {email.status === "failed" && email.errorMessage && (
          <div
            style={{
              padding: "10px 24px",
              fontSize: 12,
              color: "var(--bad-fg, var(--terra-deep))",
              borderTop: "1px solid var(--line-soft)",
            }}
          >
            {email.errorMessage}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 24px 20px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Quadrant shell ──────────────────────────────────────────

function Quadrant({
  icon,
  iconBg,
  iconFg,
  title,
  sub,
  right,
  children,
  footer,
}: {
  icon: IconName;
  iconBg: string;
  iconFg: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card
      pad={0}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--line-soft)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: "0 0 auto",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-2)",
            flex: "0 0 auto",
            background: iconBg,
            color: iconFg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={15} strokeWidth={1.7} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 400,
              fontSize: 17,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
          {sub && (
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                color: "var(--ink-faint)",
                marginTop: 2,
                letterSpacing: ".04em",
              }}
            >
              {sub}
            </div>
          )}
        </div>
        {right}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            borderTop: "1px solid var(--line-soft)",
            padding: "12px 18px",
            background: "var(--linen, var(--shell))",
            flex: "0 0 auto",
          }}
        >
          {footer}
        </div>
      )}
    </Card>
  );
}

// ─── Composer (text + attach + send) ─────────────────────────

function Composer({
  placeholder,
  meta,
}: {
  placeholder: string;
  meta?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--r-2)",
          padding: "10px 12px",
          fontSize: 12.5,
          color: "var(--ink-faint)",
          fontStyle: "italic",
          minHeight: 36,
        }}
      >
        {placeholder}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {["a", "b"].map((id) => (
          <div
            key={id}
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: "var(--r-1)",
              border: "1px solid var(--line)",
              background: "var(--shell)",
            }}
          />
        ))}
        <button
          type="button"
          aria-label="Attach photo"
          style={{
            width: 42,
            height: 42,
            borderRadius: "var(--r-1)",
            border: "1px dashed var(--line-strong)",
            background: "transparent",
            cursor: "pointer",
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
        >
          Send
        </Button>
      </div>
      {meta && (
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--ink-faint)" }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}
