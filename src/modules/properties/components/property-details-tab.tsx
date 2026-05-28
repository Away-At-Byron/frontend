"use client";

import { useMemo } from "react";
import { COUNTRIES } from "@/lib/countries";
import { AUSTRALIAN_STATES } from "@/lib/australian-states";
import { SearchSelect } from "@/modules/contacts/components/search-select";
import { SuburbAutocomplete } from "@/modules/contacts/components/suburb-autocomplete";
import type { ManagerOption, OwnerOption } from "../types";
import type { FormState } from "./property-edit-form";
import {
  PropertyAmenitiesPanel,
  type AmenityCatalogueRow,
} from "./property-amenities-panel";
import {
  ReadOnlyValue,
  Row,
  SectionCard,
  SelectInput,
  SubHeader,
  TextInput,
} from "./property-edit-fields";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

const STATE_OPTIONS = AUSTRALIAN_STATES.map((s) => ({
  value: s.code,
  label: s.name,
}));

type Props = {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  managerOptions: ManagerOption[];
  ownerOptions: OwnerOption[];
  numberOfRooms: number;
  amenityCatalogue: AmenityCatalogueRow[];
  selectedAmenityIds: Set<string>;
  onAmenityToggle: (id: string) => void;
  onAmenityClearAll: () => void;
};

export function PropertyDetailsTab({
  form,
  setField,
  managerOptions,
  ownerOptions,
  numberOfRooms,
  amenityCatalogue,
  selectedAmenityIds,
  onAmenityToggle,
  onAmenityClearAll,
}: Props) {
  const isAustralia = form.addressCountry === "AU";

  const managerOpts = useMemo(
    () =>
      managerOptions.map((m) => ({
        value: m.id,
        label: m.email ? `${m.name} — ${m.email}` : m.name,
      })),
    [managerOptions],
  );
  const ownerOpts = useMemo(
    () =>
      ownerOptions.map((o) => ({
        value: o.id,
        label: o.email ? `${o.name} — ${o.email}` : o.name,
      })),
    [ownerOptions],
  );

  const owner1 = ownerOptions.find((o) => o.id === form.owner1ContactId);
  const owner2 = ownerOptions.find((o) => o.id === form.owner2ContactId);

  /**
   * Picking a manager autoprefills On-call number and Property email once,
   * from the user record. We only overwrite blank values so an admin who's
   * customised the contact info doesn't lose it on a re-pick.
   */
  const handleManagerChange = (id: string) => {
    setField("propertyManagerUserId", id);
    if (!id) return;
    const m = managerOptions.find((x) => x.id === id);
    if (!m) return;
    if (!form.onCallNumber.trim() && m.phone) setField("onCallNumber", m.phone);
    if (!form.propertyEmail.trim() && m.email)
      setField("propertyEmail", m.email);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 14,
      }}
    >
      {/* ── Address ─────────────────────────────────────── */}
      <SectionCard icon="Pin" title="Address">
        <Row label="Property name">
          <TextInput
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </Row>
        <Row label="Street">
          <TextInput
            value={form.addressStreet}
            onChange={(e) => setField("addressStreet", e.target.value)}
          />
        </Row>
        <Row label="Suburb">
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
              onChange={(e) => setField("addressSuburb", e.target.value)}
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
              onChange={(e) => setField("addressState", e.target.value)}
              placeholder="State or region"
            />
          )}
        </Row>
        <Row label="City">
          <TextInput
            value={form.addressCity}
            onChange={(e) => setField("addressCity", e.target.value)}
          />
        </Row>
        <Row label="Post code">
          <TextInput
            value={form.addressPostcode}
            onChange={(e) => setField("addressPostcode", e.target.value)}
            mono
          />
        </Row>
        <Row label="Country">
          <SearchSelect
            value={form.addressCountry}
            onChange={(v) => setField("addressCountry", v || "AU")}
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            clearLabel="Clear country"
            emptyLabel="No matching country"
          />
        </Row>
      </SectionCard>

      {/* ── Configuration ───────────────────────────────── */}
      <SectionCard icon="Settings" title="Configuration">
        <Row label="Brand colour">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 180px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 36,
                padding: "0 12px 0 6px",
                borderRadius: "var(--r-pill)",
                border: "1px solid var(--line)",
                background: "var(--paper)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flex: "0 0 auto",
                  background: form.propertyColour || "transparent",
                  border: form.propertyColour
                    ? "1px solid var(--line-soft)"
                    : "1px dashed var(--line-strong)",
                }}
              />
              <input
                value={form.propertyColour}
                onChange={(e) => setField("propertyColour", e.target.value)}
                placeholder="Pick a swatch or paste a value"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  font: "inherit",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12.5,
                  color: "var(--ink)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </Row>
        <Row label="Number of rooms">
          <ReadOnlyValue
            value={String(numberOfRooms)}
            hint="Auto · from Rooms"
          />
        </Row>
        <Row label="Status">
          <SelectInput
            value={form.status}
            onChange={(e) =>
              setField("status", e.target.value as FormState["status"])
            }
            options={STATUS_OPTIONS}
          />
        </Row>
        <Row label="Property ABN">
          <TextInput
            value={form.taxNumber}
            onChange={(e) => setField("taxNumber", e.target.value)}
            mono
          />
        </Row>
        <Row label="Website">
          <TextInput
            value={form.website}
            onChange={(e) => setField("website", e.target.value)}
            placeholder="awaybyronbay.com"
            mono
          />
        </Row>
      </SectionCard>

      {/* ── Operations ──────────────────────────────────── */}
      <SectionCard icon="Sparkles" title="Operations">
        <Row label="Property manager">
          <SearchSelect
            value={form.propertyManagerUserId}
            onChange={handleManagerChange}
            options={managerOpts}
            placeholder="Select manager"
            clearLabel="Clear manager"
            emptyLabel="No matching manager"
          />
        </Row>
        <Row label="On-call number">
          <TextInput
            value={form.onCallNumber}
            onChange={(e) => setField("onCallNumber", e.target.value)}
            mono
          />
        </Row>
        <Row label="Property email">
          <TextInput
            value={form.propertyEmail}
            onChange={(e) => setField("propertyEmail", e.target.value)}
            mono
          />
        </Row>
        <Row label="Lockbox / access">
          <TextInput
            value={form.lockboxAccess}
            onChange={(e) => setField("lockboxAccess", e.target.value)}
          />
        </Row>
        <Row label="Wi-fi network">
          <TextInput
            value={form.wifiNetwork}
            onChange={(e) => setField("wifiNetwork", e.target.value)}
          />
        </Row>
      </SectionCard>

      {/* ── Property owners ─────────────────────────────── */}
      <SectionCard icon="User" title="Property owners">
        <SubHeader label="Owner · 1" />
        <Row label="Contact">
          <SearchSelect
            value={form.owner1ContactId}
            onChange={(v) => setField("owner1ContactId", v)}
            options={ownerOpts}
            placeholder="Select contact"
            clearLabel="Clear owner"
            emptyLabel="No matching contact"
          />
        </Row>
        <Row label="Email">
          <ReadOnlyValue value={owner1?.email ?? ""} hint="From contact" mono />
        </Row>
        <Row label="Phone">
          <ReadOnlyValue value={owner1?.phone ?? ""} hint="From contact" mono />
        </Row>

        <SubHeader label="Owner · 2" />
        <Row label="Contact">
          <SearchSelect
            value={form.owner2ContactId}
            onChange={(v) => setField("owner2ContactId", v)}
            options={ownerOpts}
            placeholder="Select contact"
            clearLabel="Clear owner"
            emptyLabel="No matching contact"
          />
        </Row>
        <Row label="Email">
          <ReadOnlyValue value={owner2?.email ?? ""} hint="From contact" mono />
        </Row>
        <Row label="Phone">
          <ReadOnlyValue value={owner2?.phone ?? ""} hint="From contact" mono />
        </Row>
      </SectionCard>
    </div>

      <PropertyAmenitiesPanel
        catalogue={amenityCatalogue}
        selected={selectedAmenityIds}
        onToggle={onAmenityToggle}
        onClearAll={onAmenityClearAll}
      />
    </div>
  );
}
