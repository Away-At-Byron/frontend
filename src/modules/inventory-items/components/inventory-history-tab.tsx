"use client"

import { Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { FormCard } from "./inventory-edit-fields"

type Event = {
  date: string
  kind: string
  by: string
  qty: string
  unitCost: string | null
  price: string | null
  inventoryValue: string
  notes: string
}

/**
 * Mock FIFO trail. Chronologically oldest first:
 *  12 Jun  Purchase +8 @ 66.00              layers: [8@66]                qty=8   val=528.00
 *  21 Aug  Adjustment -1 (FIFO 1@66)        layers: [7@66]                qty=7   val=462.00
 *  04 Sep  Purchase +4 @ 37.13              layers: [7@66, 4@37.13]       qty=11  val=610.52
 *  14 Nov  Loss BRKN -1 (FIFO 1@66)         layers: [6@66, 4@37.13]       qty=10  val=544.52
 *  20 Nov  Loss STN  -1 (FIFO 1@66)         layers: [5@66, 4@37.13]       qty=9   val=478.52
 *  22 Nov  Purchase +6 @ 48.00              layers: [5@66, 4@37.13, 6@48] qty=15  val=766.52
 * Displayed newest first.
 */
const EVENTS: Event[] = [
  { date: "22 Nov 2026", kind: "Purchase",    by: "Mia",   qty: "+6", unitCost: "48.00", price: "+288.00", inventoryValue: "766.52", notes: "Bill BNG-44218 · 6 @ A$48.00" },
  { date: "20 Nov 2026", kind: "Loss · STN",  by: "Anna",  qty: "-1", unitCost: "66.00", price: "-66.00",  inventoryValue: "478.52", notes: "Stained, Away 03 turnover" },
  { date: "14 Nov 2026", kind: "Loss · BRKN", by: "Marco", qty: "-1", unitCost: "66.00", price: "-66.00",  inventoryValue: "544.52", notes: "Broken mug, Sunrise 02" },
  { date: "04 Sep 2026", kind: "Purchase",    by: "Mia",   qty: "+4", unitCost: "37.13", price: "+148.52", inventoryValue: "610.52", notes: "Bill BNG-44102 · 4 @ A$37.13" },
  { date: "21 Aug 2026", kind: "Adjustment",  by: "Mia",   qty: "-1", unitCost: "66.00", price: "-66.00",  inventoryValue: "462.00", notes: "Stock-take correction" },
  { date: "12 Jun 2026", kind: "Purchase",    by: "Mia",   qty: "+8", unitCost: "66.00", price: "+528.00", inventoryValue: "528.00", notes: "Bill BNG-43890 · 8 @ A$66.00" },
]

const SUMMARY = {
  qtyOnHand: 15,
  inventoryValue: "766.52",
  layers: [
    { qty: 5, unitCost: "66.00", source: "Jun · BNG-43890" },
    { qty: 4, unitCost: "37.13", source: "Sep · BNG-44102" },
    { qty: 6, unitCost: "48.00", source: "Nov · BNG-44218" },
  ],
}

const COLS = [
  { label: "Date",            w: "minmax(90px, 0.9fr)",  align: "left"  as const },
  { label: "Kind",            w: "minmax(110px, 1.1fr)", align: "left"  as const },
  { label: "By",              w: "minmax(60px, 0.6fr)",  align: "left"  as const },
  { label: "Qty",             w: "minmax(56px, 0.5fr)",  align: "right" as const },
  { label: "Unit cost",       w: "minmax(80px, 0.7fr)",  align: "right" as const },
  { label: "Price",           w: "minmax(86px, 0.7fr)",  align: "right" as const },
  { label: "Inventory value", w: "minmax(94px, 0.8fr)",  align: "right" as const },
  { label: "Notes",           w: "minmax(140px, 1.6fr)", align: "left"  as const },
]

const GRID = COLS.map((c) => c.w).join(" ")

function tone(kind: string): "ok" | "bad" | "neutral" {
  if (kind.startsWith("Loss")) return "bad"
  if (kind === "Purchase") return "ok"
  return "neutral"
}

function signColor(value: string) {
  if (value.startsWith("+")) return "var(--teal-ink)"
  if (value.startsWith("-")) return "var(--terra-deep)"
  return "var(--ink)"
}

export function InventoryHistoryTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FifoSummary />

      <FormCard title="Movement history">
        {/* Header row */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--line-soft)",
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 10,
            alignItems: "center",
            background: "var(--linen-soft)",
          }}
        >
          {COLS.map((c) => (
            <div
              key={c.label}
              className="mono"
              style={{
                fontSize: 9.5,
                color: "var(--ink-faint)",
                letterSpacing: "var(--tracked)",
                textTransform: "uppercase",
                textAlign: c.align,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.label}
            </div>
          ))}
        </div>

        {EVENTS.map((e, i) => (
          <div
            key={i}
            style={{
              padding: "8px 14px",
              borderTop: "1px solid var(--line-soft)",
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                whiteSpace: "nowrap",
              }}
            >
              {e.date}
            </span>

            <div style={{ minWidth: 0 }}>
              <Pill tone={tone(e.kind)} size="sm">
                {e.kind}
              </Pill>
            </div>

            <span
              style={{
                fontSize: 12.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {e.by}
            </span>

            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 14,
                fontStyle: "italic",
                textAlign: "right",
                color: signColor(e.qty),
              }}
            >
              {e.qty}
            </span>

            <span
              className="mono"
              style={{
                fontSize: 11.5,
                textAlign: "right",
                color: e.unitCost ? "var(--ink-soft)" : "var(--ink-faint)",
              }}
            >
              {e.unitCost ? `A$${e.unitCost}` : "—"}
            </span>

            <span
              className="mono"
              style={{
                fontSize: 11.5,
                textAlign: "right",
                color: e.price ? signColor(e.price) : "var(--ink-faint)",
              }}
            >
              {e.price ? `A$${e.price.replace(/^\+/, "")}` : "—"}
            </span>

            <span
              className="mono"
              style={{
                fontSize: 11.5,
                textAlign: "right",
                color: "var(--ink)",
                fontWeight: 500,
              }}
            >
              A${e.inventoryValue}
            </span>

            <span
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={e.notes}
            >
              {e.notes}
            </span>
          </div>
        ))}

        {/* Footer hint */}
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--linen)",
          }}
        >
          <Icon name="Alert" size={12} style={{ color: "var(--ink-faint)" }} />
          <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
            Inventory valued at FIFO. Each outflow consumes the oldest remaining
            purchase layer first.
          </span>
        </div>
      </FormCard>
    </div>
  )
}

function FifoSummary() {
  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-3)",
        padding: "14px 18px",
        display: "grid",
        gridTemplateColumns: "auto auto 1fr",
        gap: 24,
        alignItems: "center",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <SummaryStat label="On hand" value={`${SUMMARY.qtyOnHand}`} suffix="units" />
      <SummaryStat
        label="Inventory value"
        value={`A$${SUMMARY.inventoryValue}`}
      />
      <div style={{ minWidth: 0 }}>
        <div
          className="mono"
          style={{
            fontSize: 9.5,
            color: "var(--ink-faint)",
            letterSpacing: "var(--tracked)",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          FIFO layers · oldest first
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {SUMMARY.layers.map((l, i) => (
            <div
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: "var(--r-pill)",
                border: "1px solid var(--line)",
                background: "var(--linen-soft)",
                fontSize: 11.5,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 13,
                  fontStyle: "italic",
                }}
              >
                {l.qty}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-soft)" }}
              >
                @ A${l.unitCost}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-faint)",
                  borderLeft: "1px solid var(--line)",
                  paddingLeft: 6,
                }}
              >
                {l.source}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 9.5,
          color: "var(--ink-faint)",
          letterSpacing: "var(--tracked)",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 300,
            letterSpacing: "var(--tight)",
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
