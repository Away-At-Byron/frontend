"use client";

/**
 * Documents tab — ported from `docs/design-reference/contact-details.jsx`.
 * Layout:
 *   1. Identity card: ID-photo slot (left) + our editable identity form
 *      fields (right).
 *   2. Booking documents — mock list.
 *   3. Other documents — mock list.
 *
 * Upload + viewer functionality is not wired yet; the buttons and rows are
 * visual placeholders.
 */
import type { ReactNode } from "react";
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { CONTACT_ID_TYPE_LABELS } from "../types";
import { DatePicker } from "./date-picker";
import { SearchSelect } from "./search-select";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import {
  COUNTRY_OPTIONS,
  Row,
  SelectInput,
  TextInput,
  YES_NO_OPTIONS,
} from "./contact-detail-fields";

// Mock document lists — wiring to real uploads lands later.
type DocItem = {
  name: string;
  size: string;
  when: string;
  type: string;
};

const BOOKING_DOCS: DocItem[] = [
  {
    name: "Booking confirmation R-5453.pdf",
    size: "82 KB",
    when: "17 Nov 2026",
    type: "Booking",
  },
  {
    name: "Payment receipt R-5311.pdf",
    size: "62 KB",
    when: "14 Jun 2025",
    type: "Receipt",
  },
];

const OTHER_DOCS: DocItem[] = [
  {
    name: "Loyalty rewards letter.pdf",
    size: "140 KB",
    when: "04 Jul 2025",
    type: "Other",
  },
];

export function DocumentsTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <IdentityCard form={form} onField={onField} setField={setField} />
      <DocList
        title="Booking documents"
        docs={BOOKING_DOCS}
        addLabel="Add booking doc"
      />
      <DocList
        title="Other documents"
        subtitle="Any other files attached to this contact — letters, agreements, vouchers, photos."
        docs={OTHER_DOCS}
        addLabel="Add document"
      />
    </div>
  );
}

// ─── Identity ─────────────────────────────────────────────────

function IdentityCard({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
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
        <Icon name="Settings" size={16} />
        <div
          style={{
            flex: 1,
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
          }}
        >
          Identity
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="Plus" size={13} />}
        >
          Upload ID
        </Button>
      </div>

      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <PhotoSlot label="ID photo" />
        <div>
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
        </div>
      </div>
    </Card>
  );
}

function PhotoSlot({ label }: { label: string }) {
  return (
    <div
      style={{
        aspectRatio: "4 / 3",
        borderRadius: "var(--r-2)",
        background: "var(--shell)",
        border: "1px dashed var(--line-strong)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: "var(--ink-faint)",
      }}
    >
      <Icon name="Plus" size={20} />
      <span
        className="caps"
        style={{
          fontSize: 9.5,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Document list ────────────────────────────────────────────

function DocList({
  title,
  subtitle,
  docs,
  addLabel,
}: {
  title: string;
  subtitle?: string;
  docs: DocItem[];
  addLabel: string;
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
        <Icon name="Sparkline" size={16} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 400,
              fontSize: 17,
              letterSpacing: "var(--tight)",
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
              }}
            >
              · {subtitle}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="Plus" size={13} />}
        >
          {addLabel}
        </Button>
      </div>

      <DocListHeader />

      {docs.length === 0 ? (
        <div
          style={{
            padding: "30px 22px",
            textAlign: "center",
            color: "var(--ink-faint)",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: 16,
          }}
        >
          No documents yet
        </div>
      ) : (
        docs.map((d) => <DocRow key={d.name} doc={d} />)
      )}
    </Card>
  );
}

const DOC_GRID = "48px 1.6fr 90px 90px 130px 80px";

function DocListHeader() {
  return (
    <div
      className="caps"
      style={{
        display: "grid",
        gridTemplateColumns: DOC_GRID,
        gap: 12,
        padding: "12px 22px",
        borderBottom: "1px solid var(--line-soft)",
        color: "var(--ink-faint)",
        fontSize: 10,
        letterSpacing: "var(--tracked)",
      }}
    >
      <span />
      <span>File</span>
      <span>Type</span>
      <span>Size</span>
      <span>Uploaded</span>
      <span />
    </div>
  );
}

function DocRow({ doc }: { doc: DocItem }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: DOC_GRID,
        gap: 12,
        alignItems: "center",
        padding: "12px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-2)",
          background: "var(--shell)",
          border: "1px solid var(--line-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DocIcon />
      </div>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: 14,
        }}
      >
        {doc.name}
      </span>
      <Pill tone="neutral" size="sm">
        {doc.type}
      </Pill>
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-faint)" }}
      >
        {doc.size}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
        {doc.when}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
        <IconButton size={28} variant="quiet" title="View">
          <ViewIcon />
        </IconButton>
        <IconButton size={28} variant="quiet" title="More">
          <Icon name="MoreVertical" size={13} />
        </IconButton>
      </div>
    </div>
  );
}

// The icon set doesn't expose a dedicated "document" or "eye" glyph, so
// the design's PDF tile and Eye action borrow the closest equivalents.
function DocIcon(): ReactNode {
  return <FauxIcon name="Edit" />;
}

function ViewIcon(): ReactNode {
  return <FauxIcon name="Search" />;
}

function FauxIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={13} />;
}
