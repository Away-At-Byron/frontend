"use client";

/**
 * Communication tab — 4-quadrant layout ported from
 * `docs/design-reference/contact-details.jsx`. Three of the quadrants
 * (In-portal messages, Emails, SMS) render the design-reference mock data
 * verbatim; wiring to real conversations lands later. The Notes &
 * Preferences quadrant is bound to the live form fields.
 */
import type { ReactNode } from "react";
import { Button, Card, Pill } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { DatePicker } from "./date-picker";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import { Row, Textarea } from "./contact-detail-fields";

// ─── Mock data (from design-reference / contact-details.jsx) ────

type ChatMessage = {
  who: "guest" | "staff";
  t: string;
  text: string;
  author?: string;
  photos?: string[];
};

const PORTAL_MESSAGES: ChatMessage[] = [
  {
    who: "guest",
    t: "19 Nov · 11:21",
    text: "Confirming arrival on Thursday — flight lands 10pm.",
  },
  {
    who: "staff",
    t: "19 Nov · 11:32",
    text: "Late check-in is fine. Keys in the lockbox, code 4421.",
    author: "Mia",
  },
  {
    who: "guest",
    t: "19 Nov · 11:35",
    text: "Sending a photo of my ID for check-in records.",
    photos: ["id"],
  },
  {
    who: "staff",
    t: "20 Nov · 09:00",
    text: "Step-by-step check-in photos for tonight.",
    author: "Mia",
    photos: ["lockbox", "wifi", "room"],
  },
  {
    who: "guest",
    t: "20 Nov · 09:14",
    text: "Got it — really helpful. See you tomorrow.",
  },
];

type EmailItem = {
  kind: "auto" | "manual";
  subject: string;
  t: string;
  dir: "in" | "out";
  preview: string;
  photos?: boolean;
};

const EMAILS: EmailItem[] = [
  {
    kind: "auto",
    subject: "Step-by-step check-in instructions",
    t: "20 Nov · 09:00",
    dir: "out",
    preview:
      "Hi Liliana, here are step-by-step photos for tonight — the lockbox, the front gate, and how to use the wifi.",
    photos: true,
  },
  {
    kind: "manual",
    subject: "Re: arrival",
    t: "19 Nov · 14:42",
    dir: "in",
    preview:
      "Confirming late check-in tonight, flight lands 10pm. Will text on the way.",
  },
  {
    kind: "auto",
    subject: "Pre-stay welcome",
    t: "19 Nov · 09:00",
    dir: "out",
    preview:
      "Looking forward to having you at Away. Booking confirmed for 22-25 Nov.",
  },
  {
    kind: "auto",
    subject: "Booking confirmation · R-5453",
    t: "17 Nov · 19:02",
    dir: "out",
    preview:
      "Your reservation is confirmed. Charges queued for 3 nights × A$280.",
  },
];

const SMS_MESSAGES: ChatMessage[] = [
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

const SMS_PHONE = "+61 421 990 882";

// ─── Tab ─────────────────────────────────────────────────────

export function CommunicationTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
}) {
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
        title="In-portal messages"
        sub="In-app thread between guest & staff"
        footer={
          <Composer
            placeholder="Reply via portal…"
            meta={`${PORTAL_MESSAGES.length} messages · last 09:14 today`}
          />
        }
      >
        <ChatThread messages={PORTAL_MESSAGES} />
      </Quadrant>

      <Quadrant
        icon="Edit"
        iconBg="rgba(232,183,158,.42)"
        iconFg="var(--terra-deep)"
        title="Emails"
        sub="Automated notifications & manual emails"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <MiniFilter on count={EMAILS.length}>
              All
            </MiniFilter>
            <MiniFilter count={EMAILS.filter((e) => e.kind === "auto").length}>
              Auto
            </MiniFilter>
            <MiniFilter
              count={EMAILS.filter((e) => e.kind === "manual").length}
            >
              Manual
            </MiniFilter>
          </div>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="primary"
              iconRight={<Icon name="ArrowRight" size={14} />}
            >
              Compose email
            </Button>
          </div>
        }
      >
        <EmailList emails={EMAILS} />
      </Quadrant>

      <Quadrant
        icon="Bell"
        iconBg="rgba(199,126,99,.20)"
        iconFg="var(--terra-deep)"
        title="SMS messages"
        sub={SMS_PHONE}
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
        sub="Everything about this guest in one spot"
      >
        <NotesAndPreferences
          form={form}
          onField={onField}
          setField={setField}
        />
      </Quadrant>
    </div>
  );
}

// ─── Notes & Preferences (live form) ─────────────────────────

function NotesAndPreferences({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
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
      <Row label="First booking">
        <DatePicker
          value={form.firstBookingDate}
          onChange={(v) => setField("firstBookingDate", v)}
        />
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

// ─── Chat thread (Portal + SMS) ──────────────────────────────

function ChatThread({ messages }: { messages: ChatMessage[] }) {
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

function ChatBubble({ m }: { m: ChatMessage }) {
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
        {me ? m.author ?? "Staff" : "Guest"} · {m.t}
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

function EmailList({ emails }: { emails: EmailItem[] }) {
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {emails.map((e, i) => (
        <div
          key={i}
          style={{
            padding: "12px 14px",
            borderRadius: "var(--r-2)",
            background: "var(--paper)",
            border: "1px solid var(--line-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill tone={e.kind === "auto" ? "info" : "neutral"} size="sm">
              {e.kind === "auto" ? "Automated" : "Manual"}
            </Pill>
            <Pill tone={e.dir === "out" ? "paper" : "ok"} size="sm">
              {e.dir === "out" ? "Sent" : "Received"}
            </Pill>
            {e.photos && (
              <Pill tone="paper" size="sm">
                Photos
              </Pill>
            )}
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                marginLeft: "auto",
              }}
            >
              {e.t}
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
            }}
          >
            {e.preview}
          </div>
        </div>
      ))}
    </div>
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
  sub: string;
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

function MiniFilter({
  on,
  count,
  children,
}: {
  on?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--r-pill)",
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--linen)" : "var(--ink)",
        border: on ? "none" : "1px solid var(--line-strong)",
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "var(--tracked)",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {count != null && (
        <span style={{ opacity: on ? 0.7 : 0.5 }}>· {count}</span>
      )}
    </span>
  );
}
