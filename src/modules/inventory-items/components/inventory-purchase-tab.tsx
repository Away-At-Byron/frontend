"use client"

import { Button, IconButton } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { FieldRow, FormCard, Select, TextInput } from "./inventory-edit-fields"

type Bill = {
  file: string
  date: string
  amount: string
}

const PREVIOUS_BILLS: Bill[] = [
  { file: "BNG-44218.pdf", date: "22 Nov 2026", amount: "A$316.80" },
  { file: "BNG-44102.pdf", date: "04 Sep 2026", amount: "A$148.50" },
  { file: "BNG-43890.pdf", date: "12 Jun 2026", amount: "A$528.00" },
]

export function InventoryPurchaseTab() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 14,
      }}
    >
      <FormCard title="Purchase record">
        <FieldRow label="Purchase date">
          <TextInput value="2026-11-22" type="date" />
        </FieldRow>
        <FieldRow label="Supplier">
          <Select value="bunnings">
            <option value="bunnings">Bunnings · trade account</option>
            <option value="ikea">IKEA · business</option>
            <option value="other">Other supplier…</option>
          </Select>
        </FieldRow>
        <FieldRow label="Invoice / bill #">
          <TextInput value="BNG-44218" mono />
        </FieldRow>
        <FieldRow label="Quantity received">
          <TextInput value="6" type="number" suffix="units" />
        </FieldRow>
        <FieldRow label="Unit cost">
          <TextInput value="48.00" prefix="A$" mono />
        </FieldRow>
        <FieldRow label="GST">
          <TextInput value="28.80" prefix="A$" mono />
        </FieldRow>
        <FieldRow label="Total">
          <TextInput value="316.80" prefix="A$" mono disabled />
        </FieldRow>
        <FieldRow label="Paid by">
          <Select value="card-4421">
            <option value="card-4421">Property card · ending 4421</option>
            <option value="card-8812">Owner card · ending 8812</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash / petty</option>
          </Select>
        </FieldRow>
        <FieldRow
          label="Push to Xero"
          hint="Queued for the next sync window. Toggle off to keep this bill local-only."
        >
          <Select value="yes">
            <option value="yes">Yes · queued for next sync</option>
            <option value="no">No · keep local</option>
          </Select>
        </FieldRow>
      </FormCard>

      <FormCard title="Bill upload">
        <div
          style={{
            padding: "18px 22px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div
            style={{
              aspectRatio: "4/3",
              borderRadius: "var(--r-3)",
              overflow: "hidden",
              border: "1.5px dashed var(--line-strong)",
              background: "var(--linen-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
              color: "var(--ink-faint)",
            }}
          >
            <Icon name="Upload" size={22} />
            <span style={{ fontSize: 12.5, fontStyle: "italic" }}>
              Drop bill / receipt (PDF, JPG)
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name="File" size={14} />
            <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              PDF, JPG or PNG, max 10 MB
            </span>
            <span style={{ flex: 1 }} />
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="Plus" size={13} />}
            >
              Upload
            </Button>
          </div>

          <div style={{ marginTop: 18 }}>
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                color: "var(--ink-faint)",
                letterSpacing: "var(--tracked)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Previous bills · {PREVIOUS_BILLS.length}
            </div>
            {PREVIOUS_BILLS.map((b) => (
              <div
                key={b.file}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "var(--r-2)",
                  background: "var(--linen)",
                  border: "1px solid var(--line-soft)",
                  marginBottom: 6,
                }}
              >
                <Icon name="File" size={14} />
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11.5,
                  }}
                >
                  {b.file}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {b.date}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontSize: 13,
                  }}
                >
                  {b.amount}
                </span>
                <IconButton size={26} variant="quiet" title={`Preview ${b.file}`}>
                  <Icon name="Eye" size={12} />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      </FormCard>
    </div>
  )
}
