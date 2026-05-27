"use client";

/**
 * Profile tab — left column holds Personal details + Address; right column
 * holds Contact + the Group section. Address fields swap between AU-aware
 * pickers and free-text when the country isn't AU.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import {
  CONTACT_TIER_LABELS,
  COMMUNICATION_PREFERENCE_LABELS,
  GUEST_TYPE_LABELS,
  type ContactSourceOption,
  type ContactTypeOption,
  type GroupOption,
  type GroupRow,
} from "../types";
import type { ContactOption, GroupMember } from "../queries";
import { addContactsToGroup, setGroupPrimary } from "../actions";
import { createGroup } from "../group-actions";
import { BirthdayPicker } from "./birthday-picker";
import { SearchSelect } from "./search-select";
import { SuburbAutocomplete } from "./suburb-autocomplete";
import { NewGroupModal } from "./group-modal";
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
  onGroupChange,
  onMembersChanged,
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
  /** Group dropdown change handler. Persists the new group id immediately
   * in edit mode so the Related Contacts picker sees the saved group. */
  onGroupChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Called after the server swap succeeds so the parent can refetch the
   * group's members. */
  onMembersChanged: () => void;
}) {
  const isAustralia = form.addressCountry === "AU";
  // Locally appended groups stay visible in the dropdown until router.refresh()
  // re-emits them via the `groups` prop. Merging in render avoids the
  // setState-in-effect anti-pattern.
  const [addedGroups, setAddedGroups] = useState<GroupOption[]>([]);
  const groupList = useMemo(() => {
    const existing = new Set(groups.map((g) => g.id));
    const merged = [
      ...groups,
      ...addedGroups.filter((g) => !existing.has(g.id)),
    ];
    return merged.sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [groups, addedGroups]);

  const handleGroupCreated = (group: GroupRow) => {
    setAddedGroups((prev) =>
      prev.some((g) => g.id === group.id)
        ? prev
        : [...prev, { id: group.id, groupName: group.groupName }],
    );
    setField("groupId", group.id);
  };
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
              onChange={(e) => {
                const nextId = e.target.value;
                setField("contactTypeId", nextId);
                // ID fields are guests-only — the server rejects the whole
                // save (incl. the new contact type) if idType is set on a
                // non-Guest type. Clear ID state when the user picks a
                // non-Guest type so the save goes through.
                const nextName =
                  contactTypes.find((t) => t.id === nextId)?.name ?? "";
                const isGuest = nextName.startsWith("Guest");
                if (!isGuest) {
                  setField("idType", "");
                  setField("idNumber", "");
                  setField("idCountry", "");
                  setField("idVerified", "no");
                  setField("idVerificationDate", "");
                }
              }}
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
          <Row label="Last contact">
            <TextInput value={lastContactDate ?? ""} disabled />
          </Row>
        </SectionCard>

        <GroupSection
          groups={groupList}
          groupId={form.groupId}
          onGroupChange={onGroupChange}
          onGroupCreated={handleGroupCreated}
          contactOptions={contactOptions}
          members={groupMembers}
          currentContactId={currentContactId}
          currentContactTypeId={form.contactTypeId}
          onCurrentContactTypeChange={(id) => setField("contactTypeId", id)}
          onMembersChanged={onMembersChanged}
        />
      </div>
    </div>
  );
}

// ─── Group section ───────────────────────────────────────────

function GroupSection({
  groups,
  groupId,
  onGroupChange,
  onGroupCreated,
  contactOptions,
  members,
  currentContactId,
  currentContactTypeId,
  onCurrentContactTypeChange,
  onMembersChanged,
}: {
  groups: GroupOption[];
  groupId: string;
  onGroupChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onGroupCreated: (group: GroupRow) => void;
  contactOptions: ContactOption[];
  members: GroupMember[];
  currentContactId: string | null;
  currentContactTypeId: string;
  onCurrentContactTypeChange: (id: string) => void;
  /** Called after a server change to group membership (primary swap or
   * adding a related contact) so the parent can refresh the members list. */
  onMembersChanged: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [savingPrimary, setSavingPrimary] = useState(false);
  const [addingRelated, setAddingRelated] = useState(false);

  const handleCreate = async (values: Parameters<typeof createGroup>[0]) => {
    const res = await createGroup(values);
    if (res.ok) {
      onGroupCreated(res.data);
      router.refresh();
      toast.success({
        title: "Group added",
        message: `${res.data.groupName} is selected for this contact.`,
      });
    }
    return res;
  };

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

  const handlePrimaryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newPrimaryId = e.target.value;
    if (!groupId || !newPrimaryId || newPrimaryId === primary?.id) return;
    setSavingPrimary(true);
    const exclude = currentContactId ? [currentContactId] : [];
    const res = await setGroupPrimary({
      groupId,
      newPrimaryId,
      excludeContactIds: exclude,
    });
    setSavingPrimary(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't update primary contact",
        message: res.error.message,
      });
      return;
    }
    // Mirror the type change for the current contact (its type lives in
    // unsaved form state, so the server intentionally skipped it).
    if (currentContactId) {
      if (newPrimaryId === currentContactId) {
        onCurrentContactTypeChange(res.data.primaryTypeId);
      } else if (
        primary?.id === currentContactId &&
        currentContactTypeId === res.data.primaryTypeId
      ) {
        onCurrentContactTypeChange(res.data.standardTypeId);
      }
    }
    onMembersChanged();
    toast.success({
      title: "Primary contact updated",
      message: "Group roles are now reassigned.",
    });
    router.refresh();
  };

  return (
    <SectionCard
      icon="User"
      title="Group"
      headerAction={
        <Button
          variant="ghost"
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          Add group
        </Button>
      }
    >
      <Row label="Group name">
        <SelectInput
          value={groupId}
          onChange={onGroupChange}
          options={[
            { value: "", label: "— No group" },
            ...groups.map((g) => ({ value: g.id, label: g.groupName })),
          ]}
        />
      </Row>
      <Row label="Related contacts">
        {groupId ? (
          (() => {
            // Hide contacts already in the group from the picker — adding them
            // is a noop and risks demoting the primary to standard.
            const inGroup = new Set(members.map((m) => m.id));
            const pickerOptions = contactOptions
              .filter((o) => !inGroup.has(o.id))
              .map((o) => ({
                value: o.id,
                label:
                  `${o.firstName} ${o.lastName}`.trim() +
                  (o.email ? ` · ${o.email}` : ""),
              }));
            // The picker holds no persistent value — selecting a contact
            // fires the server action and the field resets. value stays "".
            return (
              <SearchSelect
                value=""
                onChange={async (id) => {
                  if (!id || addingRelated) return;
                  setAddingRelated(true);
                  const res = await addContactsToGroup({
                    groupId,
                    contactIds: [id],
                  });
                  setAddingRelated(false);
                  if (!res.ok) {
                    toast.error({
                      title: "Couldn't add related contact",
                      message: res.error.message,
                    });
                    return;
                  }
                  // Refresh server data + clear the local cache so the
                  // Secondary contacts row re-renders with the new member.
                  router.refresh();
                  onMembersChanged();
                  toast.success({
                    title: "Related contact added",
                    message: "Added to this group as Guest - Group Standard.",
                  });
                }}
                options={pickerOptions}
                placeholder={
                  addingRelated ? "Adding…" : "Search contacts"
                }
                searchPlaceholder="Type a name or email"
                clearLabel="Clear"
                emptyLabel="No matching contact"
              />
            );
          })()
        ) : (
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-faint)",
              fontStyle: "italic",
            }}
          >
            Pick a group first to add related contacts.
          </span>
        )}
      </Row>
      <Row label="Primary contact">
        {members.length === 0 ? (
          <span style={{ color: "var(--ink-faint)" }}>—</span>
        ) : (
          <SelectInput
            value={primary?.id ?? ""}
            onChange={handlePrimaryChange}
            disabled={savingPrimary || !groupId}
            options={members.map((m) => {
              const name = `${m.firstName} ${m.lastName}`.trim();
              const isCurrent = m.id === currentContactId;
              return {
                value: m.id,
                label: isCurrent ? `${name} (this contact)` : name,
              };
            })}
          />
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
      <NewGroupModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
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
