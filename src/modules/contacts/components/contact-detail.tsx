"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Pill, Stat } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import {
  COMMUNICATION_PREFERENCE_LABELS,
  CONTACT_ID_TYPE_LABELS,
  CONTACT_TIER_LABELS,
  GUEST_TYPE_LABELS,
  type ContactRow,
  type ContactSourceOption,
  type ContactTypeOption,
  type GroupOption,
} from "../types";
import type { ContactOption, GroupMember } from "../queries";
import { createContact, updateContact } from "../actions";
import { BirthdayPicker } from "./birthday-picker";
import { DatePicker } from "./date-picker";
import { SearchSelect } from "./search-select";
import { SuburbAutocomplete } from "./suburb-autocomplete";
import { COUNTRIES } from "@/lib/countries";
import { AUSTRALIAN_STATES } from "@/lib/australian-states";

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));
const STATE_OPTIONS = AUSTRALIAN_STATES.map((s) => ({
  value: s.code,
  label: s.name,
}));

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

  // Form state - simple controlled inputs for the visual page; saves via
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
      {/* ── Page title (below shadow line) ── */}
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

      {/* ── Header card ── */}
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

      {/* ── Tabs ── */}
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

      {/* ── Tab content ── */}
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

// ─── Profile tab ─────────────────────────────────────────────

function ProfileTab({
  form,
  onField,
  setField,
  contactTypes,
  contactSources,
  groups,
  groupMembers,
  contactOptions,
  currentContactId,
}: {
  form: FormState;
  onField: <K extends keyof FormState>(
    key: K,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  contactTypes: ContactTypeOption[];
  contactSources: ContactSourceOption[];
  groupMembers: GroupMember[];
  contactOptions: ContactOption[];
  currentContactId: string | null;
  groups: GroupOption[];
}) {
  const isAustralia = form.addressCountry === "AU";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard icon="User" title="Personal details">
          {/* Title (Mr/Ms/Mrs/…) — commented out: no matching column in the
              contact schema, so the value would be dropped on save. */}
          <Row label="First name">
            <TextInput value={form.firstName} onChange={onField("firstName")} />
          </Row>
          <Row label="Last name">
            <TextInput value={form.lastName} onChange={onField("lastName")} />
          </Row>
          <Row label="Birthday">
            <BirthdayPicker
              value={form.birthday}
              onChange={(v) =>
                onField("birthday")({
                  target: { value: v },
                } as React.ChangeEvent<HTMLInputElement>)
              }
            />
          </Row>
          <Row label="Client #">
            <TextInput value={form.clientNumber} disabled />
          </Row>
          <Row label="Tier">
            <SelectInput
              value={form.tier}
              onChange={onField("tier")}
              options={[
                { value: "", label: "—" },
                ...Object.entries(CONTACT_TIER_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                })),
              ]}
            />
          </Row>
          <Row label="Guest type">
            <SelectInput
              value={form.guestType}
              onChange={onField("guestType")}
              options={[
                { value: "", label: "—" },
                ...Object.entries(GUEST_TYPE_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                })),
              ]}
            />
          </Row>
          <Row label="Returning guest">
            <SelectInput
              value={form.returningGuest}
              onChange={onField("returningGuest")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Portal access">
            <SelectInput
              value={form.portalEnabled}
              onChange={onField("portalEnabled")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Do not rebook">
            <SelectInput
              value={form.doNotRebook}
              onChange={onField("doNotRebook")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Preferred channel">
            <TextInput
              value={form.preferredBookingChannel}
              onChange={onField("preferredBookingChannel")}
              placeholder="e.g. Direct, Airbnb"
            />
          </Row>
        </SectionCard>

        <SectionCard icon="Pin" title="Address">
          <Row label="Address line 1">
            <TextInput
              value={form.addressStreet}
              onChange={onField("addressStreet")}
            />
          </Row>
          <Row label="Country">
            <SearchSelect
              value={form.addressCountry}
              onChange={(v) => setField("addressCountry", v)}
              options={COUNTRY_OPTIONS}
              placeholder="Select country"
              clearLabel="Clear country"
              emptyLabel="No matching country"
            />
          </Row>
          <Row label="Town / Suburb">
            {isAustralia ? (
              <SuburbAutocomplete
                value={form.addressSuburb}
                onChange={(v) => setField("addressSuburb", v)}
                onPick={(s) => {
                  setField("addressState", s.state);
                  setField("addressPostcode", s.postcode);
                }}
              />
            ) : (
              <TextInput
                value={form.addressSuburb}
                onChange={onField("addressSuburb")}
              />
            )}
          </Row>
          <Row label="State">
            {isAustralia ? (
              <SearchSelect
                value={form.addressState}
                onChange={(v) => setField("addressState", v)}
                options={STATE_OPTIONS}
                placeholder="Select state"
                clearLabel="Clear state"
                emptyLabel="No matching state"
              />
            ) : (
              <TextInput
                value={form.addressState}
                onChange={onField("addressState")}
                placeholder="State or region"
              />
            )}
          </Row>
          <Row label="City">
            <TextInput
              value={form.addressCity}
              onChange={onField("addressCity")}
            />
          </Row>
          <Row label="Postcode">
            <TextInput
              value={form.addressPostcode}
              onChange={onField("addressPostcode")}
            />
          </Row>
        </SectionCard>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard icon="Message" title="Contact">
          <Row label="Email">
            <TextInput value={form.email} onChange={onField("email")} />
          </Row>
          <Row label="Mobile">
            <TextInput value={form.phone} onChange={onField("phone")} />
          </Row>
          {/* Phone (alt) — commented out: no matching column in the contact
              schema, so the value would be dropped on save. */}
          <Row label="Preferred">
            <SelectInput
              value={form.communicationPreference}
              onChange={onField("communicationPreference")}
              options={Object.entries(COMMUNICATION_PREFERENCE_LABELS).map(
                ([v, l]) => ({ value: v, label: l }),
              )}
            />
          </Row>
          <Row label="Marketing opt-in">
            <SelectInput
              value={form.marketingOptIn}
              onChange={onField("marketingOptIn")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Contact type">
            <SelectInput
              value={form.contactTypeId}
              onChange={onField("contactTypeId")}
              options={[
                { value: "", label: "—" },
                ...contactTypes.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </Row>
          <Row label="Source">
            <SelectInput
              value={form.contactSourceId}
              onChange={onField("contactSourceId")}
              options={[
                { value: "", label: "—" },
                ...contactSources.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </Row>
          <Row label="Group">
            <SelectInput
              value={form.groupId}
              onChange={onField("groupId")}
              options={[
                { value: "", label: "— No group" },
                ...groups.map((g) => ({ value: g.id, label: g.groupName })),
              ]}
            />
          </Row>
          <Row label="OTA user">
            <SelectInput
              value={form.otaUser}
              onChange={onField("otaUser")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Direct booking">
            <SelectInput
              value={form.directBookingGuest}
              onChange={onField("directBookingGuest")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Corporate guest">
            <SelectInput
              value={form.corporateGuest}
              onChange={onField("corporateGuest")}
              options={YES_NO_OPTIONS}
            />
          </Row>
          <Row label="Related contact">
            <SearchSelect
              value={form.relatedClientId}
              onChange={(v) => setField("relatedClientId", v)}
              options={contactOptions.map((o) => ({
                value: o.id,
                label: `${o.firstName} ${o.lastName}`.trim() +
                  (o.email ? ` · ${o.email}` : ""),
              }))}
              placeholder="Search contacts"
              searchPlaceholder="Type a name or email"
              clearLabel="Clear related contact"
              emptyLabel="No matching contact"
            />
          </Row>
          <Row label="Last contact">
            <DatePicker
              value={form.lastContactDate}
              onChange={(v) => setField("lastContactDate", v)}
            />
          </Row>
        </SectionCard>

        <GroupSection
          groups={groups}
          groupId={form.groupId}
          members={groupMembers}
          currentContactId={currentContactId}
        />
      </div>
    </div>
  );
}

// ─── Group section (Profile tab) ─────────────────────────────

function GroupSection({
  groups,
  groupId,
  members,
  currentContactId,
}: {
  groups: GroupOption[];
  groupId: string;
  members: GroupMember[];
  currentContactId: string | null;
}) {
  const groupName = groups.find((g) => g.id === groupId)?.groupName ?? null;

  // "Primary vs Standard is encoded in the member's contact type" (groups
  // schema). Pick the first member whose type name contains "Primary"; fall
  // back to the oldest member.
  const primary =
    members.find((m) =>
      (m.contactTypeName ?? "").toLowerCase().includes("primary"),
    ) ??
    members[0] ??
    null;
  const secondaries = members.filter((m) => m.id !== primary?.id);

  return (
    <SectionCard icon="User" title="Group">
      {!groupId || !groupName ? (
        <div
          style={{
            padding: "20px 22px",
            color: "var(--ink-soft)",
            fontSize: 13.5,
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          This contact isn’t in a group. Pick one under Contact › Group.
        </div>
      ) : (
        <>
          <Row label="Group name">
            <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
              {groupName}
            </span>
          </Row>
          <Row label="Primary contact">
            {primary ? (
              <MemberLink
                member={primary}
                isCurrent={primary.id === currentContactId}
              />
            ) : (
              <span style={{ color: "var(--ink-faint)" }}>—</span>
            )}
          </Row>
          <Row label="Secondary contacts">
            {secondaries.length === 0 ? (
              <span style={{ color: "var(--ink-faint)" }}>None</span>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {secondaries.map((m) => (
                  <MemberLink
                    key={m.id}
                    member={m}
                    isCurrent={m.id === currentContactId}
                  />
                ))}
              </div>
            )}
          </Row>
        </>
      )}
    </SectionCard>
  );
}

function MemberLink({
  member,
  isCurrent,
}: {
  member: GroupMember;
  isCurrent: boolean;
}) {
  const name = `${member.firstName} ${member.lastName}`.trim();
  const typeLabel = member.contactTypeName ?? "Contact";
  if (isCurrent) {
    return (
      <span
        style={{
          fontSize: 13.5,
          color: "var(--ink-soft)",
          fontStyle: "italic",
        }}
      >
        {name} <span style={{ color: "var(--ink-faint)" }}>(this contact)</span>
        <span style={{ marginLeft: 8, color: "var(--ink-faint)", fontSize: 12 }}>
          · {typeLabel}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={`/contacts/${member.id}`}
      style={{
        fontSize: 13.5,
        color: "var(--ink)",
        textDecoration: "none",
        borderBottom: "1px dotted var(--line-strong)",
        width: "fit-content",
      }}
    >
      {name}
      <span style={{ marginLeft: 8, color: "var(--ink-faint)", fontSize: 12 }}>
        · {typeLabel}
      </span>
    </Link>
  );
}

// ─── Communication tab ───────────────────────────────────────

function CommunicationTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: <K extends keyof FormState>(
    key: K,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  const onText =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onField(key)({
        target: { value: e.target.value },
      } as React.ChangeEvent<HTMLInputElement>);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <SectionCard icon="Message" title="Notes & Preferences">
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
      </SectionCard>
    </div>
  );
}

// ─── Documents tab ───────────────────────────────────────────

function DocumentsTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: <K extends keyof FormState>(
    key: K,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <SectionCard icon="Settings" title="Identity & verification">
        <Row label="ID type">
          <SelectInput
            value={form.idType}
            onChange={onField("idType")}
            options={[
              { value: "", label: "—" },
              ...Object.entries(CONTACT_ID_TYPE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
            ]}
          />
        </Row>
        <Row label="ID number">
          <TextInput value={form.idNumber} onChange={onField("idNumber")} />
        </Row>
        <Row label="ID country">
          <SearchSelect
            value={form.idCountry}
            onChange={(v) => setField("idCountry", v)}
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            clearLabel="Clear country"
            emptyLabel="No matching country"
          />
        </Row>
        <Row label="ID verified">
          <SelectInput
            value={form.idVerified}
            onChange={onField("idVerified")}
            options={YES_NO_OPTIONS}
          />
        </Row>
        <Row label="Verified on">
          <DatePicker
            value={form.idVerificationDate}
            onChange={(v) => setField("idVerificationDate", v)}
            placeholder="Select date"
          />
        </Row>
      </SectionCard>
    </div>
  );
}

// ─── Guest History tab ───────────────────────────────────────

type BookingRow = {
  ref: string;
  dates: string;
  propertyRoom: string;
  nights: number;
  total: number;
  source: string;
  status: "pending" | "departed" | "active";
  accent: "teal" | "terra" | "ink";
};

// Mock bookings — the Booking module hasn't landed yet (FRS §6.5). Replace
// with real data once it does.
const MOCK_BOOKINGS: BookingRow[] = [
  {
    ref: "R-5453",
    dates: "22-25 Nov 2026",
    propertyRoom: "Away 03",
    nights: 3,
    total: 840,
    source: "Booking.com",
    status: "pending",
    accent: "teal",
  },
  {
    ref: "R-5311",
    dates: "10-14 Jun 2025",
    propertyRoom: "Sunrise 03",
    nights: 4,
    total: 720,
    source: "Direct",
    status: "departed",
    accent: "terra",
  },
  {
    ref: "R-5102",
    dates: "02-05 Apr 2024",
    propertyRoom: "BGH 02",
    nights: 3,
    total: 610,
    source: "Direct",
    status: "departed",
    accent: "ink",
  },
];

const PREFERRED_CHANNEL = "Booking.com";

type BookingFilter = "all" | "past" | "active";

function aud(n: number): string {
  return `A$${n.toLocaleString("en-AU")}`;
}

function GuestHistoryTab() {
  const [filter, setFilter] = useState<BookingFilter>("all");

  const totalStays = MOCK_BOOKINGS.length;
  const totalNights = MOCK_BOOKINGS.reduce((s, b) => s + b.nights, 0);
  const avgStay = totalStays ? totalNights / totalStays : 0;
  const lifetime = MOCK_BOOKINGS.reduce((s, b) => s + b.total, 0);
  const avgValue = totalStays ? Math.round(lifetime / totalStays) : 0;

  const counts = {
    all: MOCK_BOOKINGS.length,
    past: MOCK_BOOKINGS.filter((b) => b.status === "departed").length,
    active: MOCK_BOOKINGS.filter(
      (b) => b.status === "pending" || b.status === "active",
    ).length,
  };

  const filtered = MOCK_BOOKINGS.filter((b) => {
    if (filter === "all") return true;
    if (filter === "past") return b.status === "departed";
    return b.status === "pending" || b.status === "active";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <Stat icon="Bed" label="Total stays" value={totalStays} />
        <Stat
          icon="Calendar"
          label="Avg stay length"
          value={`${avgStay.toFixed(1)} nts`}
        />
        <Stat icon="Dollar" label="Lifetime revenue" value={aud(lifetime)} />
        <Stat icon="Sparkline" label="Avg booking value" value={aud(avgValue)} />
      </div>

      {/* Bottom: bookings table (left) + booking patterns (right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <Card pad={0}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 400,
                fontSize: 20,
                letterSpacing: "var(--tight)",
              }}
            >
              Bookings
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BookingFilterPill
                on={filter === "all"}
                count={counts.all}
                onClick={() => setFilter("all")}
              >
                All
              </BookingFilterPill>
              <BookingFilterPill
                on={filter === "past"}
                count={counts.past}
                onClick={() => setFilter("past")}
              >
                Past
              </BookingFilterPill>
              <BookingFilterPill
                on={filter === "active"}
                count={counts.active}
                onClick={() => setFilter("active")}
              >
                Active & upcoming
              </BookingFilterPill>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "70px 110px 1fr 50px 80px 1fr 110px 24px",
              gap: 12,
              padding: "10px 22px",
              borderTop: "1px solid var(--line-soft)",
              borderBottom: "1px solid var(--line-soft)",
            }}
            className="caps"
          >
            <span style={{ color: "var(--ink-faint)" }}>Ref</span>
            <span style={{ color: "var(--ink-faint)" }}>Dates</span>
            <span style={{ color: "var(--ink-faint)" }}>
              Property · Room
            </span>
            <span style={{ color: "var(--ink-faint)" }}>Nts</span>
            <span style={{ color: "var(--ink-faint)" }}>Total</span>
            <span style={{ color: "var(--ink-faint)" }}>Source</span>
            <span style={{ color: "var(--ink-faint)" }}>Status</span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: "32px 22px",
                textAlign: "center",
                color: "var(--ink-soft)",
                fontSize: 13.5,
              }}
            >
              No bookings match this filter.
            </div>
          ) : (
            filtered.map((b, i) => <BookingRowItem key={b.ref} row={b} isFirst={i === 0} />)
          )}
        </Card>

        <Card pad={0}>
          <div
            style={{
              padding: "18px 22px",
              fontFamily: "var(--font-display), serif",
              fontWeight: 400,
              fontSize: 20,
              letterSpacing: "var(--tight)",
            }}
          >
            Booking patterns
          </div>
          <PatternRow label="Total stays">
            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontSize: 18,
              }}
            >
              {totalStays}
            </span>
          </PatternRow>
          <PatternRow label="Average stay">{avgStay.toFixed(1)} nights</PatternRow>
          <PatternRow label="Lifetime revenue">{aud(lifetime)}</PatternRow>
          <PatternRow label="Avg booking value">{aud(avgValue)}</PatternRow>
          <PatternRow label="Preferred channel">
            <Pill tone="paper" size="sm">
              {PREFERRED_CHANNEL}
            </Pill>
          </PatternRow>
        </Card>
      </div>
    </div>
  );
}

function BookingRowItem({ row, isFirst }: { row: BookingRow; isFirst: boolean }) {
  const accentColor: Record<BookingRow["accent"], string> = {
    teal: "var(--teal-ink)",
    terra: "var(--terra-deep)",
    ink: "var(--ink)",
  };
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "70px 110px 1fr 50px 80px 1fr 110px 24px",
        gap: 12,
        alignItems: "center",
        padding: "16px 22px",
        borderTop: isFirst ? "none" : "1px solid var(--line-soft)",
        fontSize: 13.5,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 3,
          background: accentColor[row.accent],
        }}
      />
      <span
        className="mono"
        style={{ color: "var(--ink-faint)", fontSize: 12 }}
      >
        {row.ref}
      </span>
      <span style={{ color: "var(--ink)" }}>{row.dates}</span>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontSize: 15,
        }}
      >
        {row.propertyRoom}
      </span>
      <span>{row.nights}</span>
      <span style={{ color: "var(--ink)" }}>{aud(row.total)}</span>
      <span style={{ color: "var(--ink-soft)" }}>{row.source}</span>
      <span>
        <BookingStatusPill status={row.status} />
      </span>
      <Icon
        name="ChevronDown"
        size={14}
        style={{ transform: "rotate(-90deg)", color: "var(--ink-faint)" }}
      />
    </div>
  );
}

function BookingStatusPill({ status }: { status: BookingRow["status"] }) {
  if (status === "pending") {
    return (
      <Pill
        tone="neutral"
        size="sm"
        style={{
          background: "var(--apricot, var(--warn-bg))",
          color: "var(--ink)",
          border: "1px solid transparent",
        }}
      >
        Pending
      </Pill>
    );
  }
  if (status === "active") {
    return (
      <Pill tone="ok" size="sm">
        Active
      </Pill>
    );
  }
  return (
    <Pill tone="paper" size="sm">
      Departed
    </Pill>
  );
}

function BookingFilterPill({
  children,
  on,
  count,
  onClick,
}: {
  children: ReactNode;
  on?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: "var(--r-pill)",
        cursor: "pointer",
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--linen)" : "var(--ink)",
        border: on ? "none" : "1px solid var(--line-strong)",
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "var(--tracked)",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {count != null && <span style={{ opacity: on ? 0.7 : 0.5 }}>· {count}</span>}
    </button>
  );
}

function PatternRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "12px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 10,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

// ─── Layout helpers ──────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card pad={0}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 22px",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <Icon name={icon} size={16} />
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: 0 }}>{children}</div>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "10px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 10,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--line)",
  background: "var(--paper)",
  font: "inherit",
  fontSize: 13.5,
  color: "var(--ink)",
  outline: "none",
};

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...fieldStyle,
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        ...fieldStyle,
        height: "auto",
        padding: "10px 12px",
        borderRadius: "var(--r-2)",
        resize: "vertical",
        fontFamily: "inherit",
        lineHeight: 1.45,
      }}
    />
  );
}

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...fieldStyle, appearance: "auto" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Form state mapping ──────────────────────────────────────

type FormState = {
  // title: string; // commented — not in the contact schema
  firstName: string;
  lastName: string;
  birthday: string;
  clientNumber: string;
  tier: string;
  guestType: string;
  returningGuest: string;
  portalEnabled: string;
  doNotRebook: string;
  preferredBookingChannel: string;
  email: string;
  phone: string;
  // phoneAlt: string; // commented — not in the contact schema
  communicationPreference: string;
  marketingOptIn: string;
  contactTypeId: string;
  contactSourceId: string;
  groupId: string;
  otaUser: string;
  directBookingGuest: string;
  corporateGuest: string;
  relatedClientId: string;
  lastContactDate: string;
  addressStreet: string;
  addressCity: string;
  addressSuburb: string;
  addressState: string;
  addressPostcode: string;
  addressCountry: string;
  notes: string;
  firstBookingDate: string;
  specialRequests: string;
  accessibilityRequirements: string;
  idType: string;
  idNumber: string;
  idCountry: string;
  idVerified: string;
  idVerificationDate: string;
};

function initialForm(c: ContactRow | null): FormState {
  return {
    firstName: c?.firstName ?? "",
    lastName: c?.lastName ?? "",
    birthday: c?.birthday ?? "",
    clientNumber: c ? `G-${c.id.slice(0, 4).toUpperCase()}` : "",
    tier: c?.tier ?? "",
    guestType: c?.guestType ?? "",
    returningGuest: c?.returningGuest ? "yes" : "no",
    portalEnabled: c?.portalEnabled ? "yes" : "no",
    doNotRebook: c?.doNotRebook ? "yes" : "no",
    preferredBookingChannel: c?.preferredBookingChannel ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    communicationPreference: c?.communicationPreference ?? "email",
    marketingOptIn: c?.marketingOptIn ? "yes" : "no",
    contactTypeId: c?.contactTypeId ?? "",
    contactSourceId: c?.contactSourceId ?? "",
    groupId: c?.groupId ?? "",
    otaUser: c?.otaUser ? "yes" : "no",
    directBookingGuest: c?.directBookingGuest ? "yes" : "no",
    corporateGuest: c?.corporateGuest ? "yes" : "no",
    relatedClientId: c?.relatedClientId ?? "",
    lastContactDate: c?.lastContactDate ?? "",
    addressStreet: c?.addressStreet ?? "",
    addressCity: c?.addressCity ?? "",
    addressSuburb: c?.addressSuburb ?? "",
    addressState: c?.addressState ?? "",
    addressPostcode: c?.addressPostcode ?? "",
    addressCountry: c?.addressCountry ?? "AU",
    notes: c?.notes ?? "",
    firstBookingDate: c?.firstBookingDate ?? "",
    specialRequests: c?.specialRequests ?? "",
    accessibilityRequirements: c?.accessibilityRequirements ?? "",
    idType: c?.idType ?? "",
    idNumber: c?.idNumber ?? "",
    idCountry: c?.idCountry ?? "",
    idVerified: c?.idVerified ? "yes" : "no",
    idVerificationDate: c?.idVerificationDate ?? "",
  };
}

function toPayload(f: FormState) {
  return {
    contactTypeId: f.contactTypeId || undefined,
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email || undefined,
    phone: f.phone || undefined,
    addressStreet: f.addressStreet || undefined,
    addressCity: f.addressCity || undefined,
    addressSuburb: f.addressSuburb || undefined,
    addressState: f.addressState || undefined,
    addressPostcode: f.addressPostcode || undefined,
    addressCountry: f.addressCountry || undefined,
    birthday: f.birthday || undefined,
    communicationPreference:
      (f.communicationPreference as
        | "email"
        | "sms"
        | "both"
        | "none"
        | "unsubscribed") || "email",
    marketingOptIn: f.marketingOptIn === "yes",
    returningGuest: f.returningGuest === "yes",
    portalEnabled: f.portalEnabled === "yes",
    otaUser: f.otaUser === "yes",
    directBookingGuest: f.directBookingGuest === "yes",
    corporateGuest: f.corporateGuest === "yes",
    idVerified: f.idVerified === "yes",
    doNotRebook: f.doNotRebook === "yes",
    tier: (f.tier as "bronze" | "silver" | "gold" | "vip") || undefined,
    guestType:
      (f.guestType as
        | "leisure"
        | "corporate"
        | "family"
        | "couple"
        | "group"
        | "vip"
        | "event_guest") || undefined,
    preferredBookingChannel: f.preferredBookingChannel || undefined,
    relatedClientId: f.relatedClientId || undefined,
    lastContactDate: f.lastContactDate || undefined,
    firstBookingDate: f.firstBookingDate || undefined,
    notes: f.notes || undefined,
    specialRequests: f.specialRequests || undefined,
    accessibilityRequirements: f.accessibilityRequirements || undefined,
    contactSourceId: f.contactSourceId || undefined,
    groupId: f.groupId || undefined,
    idType:
      (f.idType as "passport" | "drivers_license" | "national_id") || undefined,
    idNumber: f.idNumber || undefined,
    idCountry: f.idCountry || undefined,
    idVerificationDate: f.idVerificationDate || undefined,
  };
}
