"use client"

import { useState } from "react"
import { Icon } from "@/components/ui/icon"
import { FieldRow, FormCard, Select, TextInput } from "./inventory-edit-fields"

const REASONS = [
  { code: "LOST", label: "Lost", desc: "Cannot be located" },
  { code: "DMG", label: "Damaged", desc: "Damaged beyond use" },
  { code: "BRKN", label: "Broken", desc: "Mechanical / structural failure" },
  { code: "STN", label: "Stained", desc: "Linen / fabric staining" },
  { code: "WRN", label: "Worn out", desc: "End of useful life" },
  { code: "WST", label: "Wasted", desc: "Expired / spoiled (consumable)" },
  { code: "THFT", label: "Theft", desc: "Reported missing after guest stay" },
  { code: "WRTOFF", label: "Write-off", desc: "Other, explain in notes" },
]

const RECENT_LOSSES = [
  { what: "Bath towel · 2", when: "18 Nov · stained", reason: "STN" },
  { what: "Coffee mug · 1", when: "14 Nov · broken", reason: "BRKN" },
  { what: "Hair dryer · 1", when: "08 Nov · theft", reason: "THFT" },
]

export function InventoryLossTab() {
  const [reason, setReason] = useState("LOST")
  const [qty, setQty] = useState("1")
  const [notes, setNotes] = useState("")

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 14,
      }}
    >
      <FormCard title="Record loss / damage">
        <FieldRow label="Date noticed">
          <TextInput value="2026-11-20" type="date" />
        </FieldRow>
        <FieldRow label="Quantity affected">
          <TextInput
            value={qty}
            onChange={setQty}
            type="number"
            step={1}
            min={0}
            suffix="units"
          />
        </FieldRow>
        <FieldRow label="Property">
          <Select value="away">
            <option value="away">Away Guesthouse</option>
            <option value="shirley">Away on Shirley Lane</option>
            <option value="unwind">Unwind Guesthouse</option>
          </Select>
        </FieldRow>
        <FieldRow label="Room (optional)">
          <Select value="away-03">
            <option value="">— None —</option>
            <option value="away-03">Away 03</option>
            <option value="away-04">Away 04</option>
            <option value="shirley-01">Shirley 01</option>
          </Select>
        </FieldRow>
        <FieldRow label="Reported by">
          <Select value="anna">
            <option value="anna">Anna T. (Housekeeper)</option>
            <option value="marco">Marco F. (Housekeeper)</option>
            <option value="mia">Mia R. (Manager)</option>
          </Select>
        </FieldRow>
        <FieldRow label="Linked booking">
          <TextInput value="R-5421" placeholder="R-5421 (optional)" mono />
        </FieldRow>

        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: "var(--ink-faint)",
              letterSpacing: "var(--tracked)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Reason code
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {REASONS.map((r) => {
              const on = r.code === reason
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setReason(r.code)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "var(--r-2)",
                    background: on ? "var(--linen-soft)" : "var(--paper)",
                    color: "var(--ink)",
                    border: on
                      ? "1px solid var(--ink)"
                      : "1px solid var(--line)",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: "3px 7px",
                      borderRadius: 4,
                      letterSpacing: ".04em",
                      background: on ? "var(--ink)" : "var(--linen-soft)",
                      color: on ? "var(--linen)" : "var(--ink-faint)",
                    }}
                  >
                    {r.code}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-soft)",
                        marginTop: 2,
                      }}
                    >
                      {r.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
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
            Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to add, guest interaction, follow-up needed…"
            rows={4}
            style={{
              width: "100%",
              background: "var(--paper)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--r-2)",
              padding: "12px 14px",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink)",
              font: "inherit",
              resize: "vertical",
              outline: "none",
              minHeight: 80,
            }}
          />
        </div>

        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--line-soft)",
            background: "var(--linen)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="Alert" size={14} style={{ color: "var(--terra-deep)" }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
            Saving will decrement the on-hand quantity by{" "}
            <strong style={{ color: "var(--terra-deep)" }}>
              {qty} {Number(qty) === 1 ? "unit" : "units"}
            </strong>{" "}
            and write an audit entry.
          </span>
        </div>
      </FormCard>

      <FormCard title="Evidence photo">
        <div
          style={{
            padding: "16px 18px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div
            style={{
              aspectRatio: "4/3",
              borderRadius: "var(--r-2)",
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
              Drop a photo (optional)
            </span>
          </div>

          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: "var(--ink-faint)",
              letterSpacing: "var(--tracked)",
              textTransform: "uppercase",
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            Recent losses
          </div>
          {RECENT_LOSSES.map((e) => (
            <div
              key={e.what}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderTop: "1px solid var(--line-soft)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--linen-soft)",
                  color: "var(--ink-faint)",
                  letterSpacing: ".04em",
                }}
              >
                {e.reason}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{e.what}</div>
                <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  {e.when}
                </div>
              </div>
            </div>
          ))}
        </div>
      </FormCard>
    </div>
  )
}
