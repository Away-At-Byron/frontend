"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import {
  type ContactRow,
  type ContactSourceOption,
  type ContactTypeOption,
  type GroupOption,
} from "../types";
import type { ContactOption, GroupMember } from "../queries";
import { createContact, updateContact } from "../actions";
import {
  initialForm,
  toPayload,
  type FormState,
} from "./contact-detail-form";
import { ProfileTab } from "./contact-detail-profile";
import { CommunicationTab } from "./contact-detail-communication";
import { DocumentsTab } from "./contact-detail-documents";
import { GuestHistoryTab } from "./contact-detail-history";

type TabId = "profile" | "history" | "communication" | "documents";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "history", label: "Guest History" },
  { id: "communication", label: "Communication" },
  { id: "documents", label: "Documents" },
];

export function ContactDetail({
  contact,
  mode,
  contactTypes,
  contactSources,
  groups,
  groupMembers,
  contactOptions,
}: {
  contact: ContactRow | null;
  mode: "new" | "edit";
  contactTypes: ContactTypeOption[];
  contactSources: ContactSourceOption[];
  groups: GroupOption[];
  groupMembers: GroupMember[];
  contactOptions: ContactOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);

  // Form state — simple controlled inputs for the visual page; saves via
  // the existing create/update actions. Schema-level validation runs server
  // side, mirroring what the modal does.
  const [form, setForm] = useState(() => initialForm(contact));

  const handleField =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const payload = toPayload(form);
    const res = await (mode === "new"
      ? createContact(payload)
      : updateContact(contact!.id, payload));
    setSaving(false);
    if (res.ok) {
      toast.success({
        title: mode === "new" ? "Contact created" : "Contact saved",
        message: `${res.data.firstName} ${res.data.lastName}`,
      });
      router.push(`/contacts/${res.data.id}`);
      router.refresh();
    } else {
      toast.error({
        title: "Couldn't save contact",
        message: res.error.message,
      });
    }
  };

  return (
    <div
      style={{
        padding: "24px 32px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 300,
          fontSize: 32,
          letterSpacing: "var(--tight)",
          margin: 0,
        }}
      >
        {mode === "new" ? "Add" : "Edit"}{" "}
        <em style={{ fontStyle: "italic" }}>Contact</em>
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/contacts"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px 8px 10px",
            borderRadius: "var(--r-pill)",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            fontSize: 13,
            textDecoration: "none",
            marginTop: 18,
          }}
        >
          <Icon
            name="ChevronDown"
            size={14}
            style={{ transform: "rotate(90deg)" }}
          />
          Contacts
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 300,
              fontSize: 30,
              lineHeight: 1.1,
              marginTop: 4,
              letterSpacing: "var(--tight)",
            }}
          >
            {form.firstName || form.lastName ? (
              <>
                {form.firstName}{" "}
                <em style={{ fontStyle: "italic" }}>{form.lastName}</em>
              </>
            ) : (
              <span style={{ color: "var(--ink-faint)" }}>New contact</span>
            )}
          </div>
          {contact?.id && (
            <div
              className="mono"
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "var(--ink-faint)",
                letterSpacing: "var(--tracked)",
              }}
            >
              {contact.id.slice(0, 8).toUpperCase()}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <Button variant="paper" icon={<Icon name="Message" size={15} />}>
            Message
          </Button>
          <Button variant="paper" icon={<Icon name="Calendar" size={15} />}>
            New booking
          </Button>
          <Button
            variant="primary"
            iconRight={<Icon name="Check" size={15} />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 28,
          borderBottom: "1px solid var(--line-soft)",
        }}
        role="tablist"
      >
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 2px",
                font: "inherit",
                fontSize: 14,
                fontWeight: on ? 600 : 500,
                color: on ? "var(--ink)" : "var(--ink-soft)",
                borderBottom: on
                  ? "2px solid var(--ink)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <ProfileTab
          form={form}
          onField={handleField}
          setField={setField}
          contactTypes={contactTypes}
          contactSources={contactSources}
          groups={groups}
          groupMembers={groupMembers}
          contactOptions={contactOptions}
          currentContactId={contact?.id ?? null}
        />
      )}
      {tab === "history" && <GuestHistoryTab />}
      {tab === "communication" && (
        <CommunicationTab
          form={form}
          onField={handleField}
          setField={setField}
        />
      )}
      {tab === "documents" && (
        <DocumentsTab
          form={form}
          onField={handleField}
          setField={setField}
        />
      )}
    </div>
  );
}
