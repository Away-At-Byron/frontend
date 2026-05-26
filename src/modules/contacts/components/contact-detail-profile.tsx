"use client";

/**
 * Profile tab — left column holds Personal details + Address; right column
 * holds Contact + the Group section. Address fields swap between AU-aware
 * pickers and free-text when the country isn't AU.
 */
import Link from "next/link";
import {
  CONTACT_TIER_LABELS,
  COMMUNICATION_PREFERENCE_LABELS,
  GUEST_TYPE_LABELS,
  type ContactSourceOption,
  type ContactTypeOption,
  type GroupOption,
} from "../types";
import type { ContactOption, GroupMember } from "../queries";
import { BirthdayPicker } from "./birthday-picker";
import { SearchSelect } from "./search-select";
import { SuburbAutocomplete } from "./suburb-autocomplete";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import {
  COUNTRY_OPTIONS,
  Row,
  STATE_OPTIONS,
  SectionCard,
  SelectInput,
  TextInput,
  YES_NO_OPTIONS,
} from "./contact-detail-fields";

export function ProfileTab({
  form,
  onField,
  setField,
  contactTypes,
  contactSources,
  groups,
  groupMembers,
  contactOptions,
  currentContactId,
  lastContactDate,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
  contactTypes: ContactTypeOption[];
  contactSources: ContactSourceOption[];
  groupMembers: GroupMember[];
  contactOptions: ContactOption[];
  currentContactId: string | null;
  groups: GroupOption[];
  lastContactDate: string | null;
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
          <Row label="Related contact">
            <SearchSelect
              value={form.relatedClientId}
              onChange={(v) => setField("relatedClientId", v)}
              options={contactOptions.map((o) => ({
                value: o.id,
                label:
                  `${o.firstName} ${o.lastName}`.trim() +
                  (o.email ? ` · ${o.email}` : ""),
              }))}
              placeholder="Search contacts"
              searchPlaceholder="Type a name or email"
              clearLabel="Clear related contact"
              emptyLabel="No matching contact"
            />
          </Row>
          <Row label="Last contact">
            <TextInput value={lastContactDate ?? ""} disabled />
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

// ─── Group section ───────────────────────────────────────────

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
        <span
          style={{ marginLeft: 8, color: "var(--ink-faint)", fontSize: 12 }}
        >
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
