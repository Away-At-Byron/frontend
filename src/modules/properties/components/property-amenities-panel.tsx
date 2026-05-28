"use client"

import { useMemo, useState } from "react"
import { Icon } from "@/components/ui/icon"

export type AmenityCatalogueRow = {
  id: string
  category: string
  name: string
  sortOrder: number
}

type Filter = "all" | "selected" | "available"

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  selected: "Selected",
  available: "Available",
}

type Group = { category: string; items: AmenityCatalogueRow[] }

function groupByCategory(rows: AmenityCatalogueRow[]): Group[] {
  const out: Group[] = []
  for (const r of rows) {
    const last = out[out.length - 1]
    if (last && last.category === r.category) {
      last.items.push(r)
    } else {
      out.push({ category: r.category, items: [r] })
    }
  }
  return out
}

export function PropertyAmenitiesPanel({
  catalogue,
  selected,
  onToggle,
  onClearAll,
}: {
  catalogue: AmenityCatalogueRow[]
  selected: Set<string>
  onToggle: (id: string) => void
  onClearAll: () => void
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const total = catalogue.length
  const selCount = selected.size
  const availCount = total - selCount

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalogue.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false
      if (filter === "selected" && !selected.has(r.id)) return false
      if (filter === "available" && selected.has(r.id)) return false
      return true
    })
  }, [catalogue, query, filter, selected])

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])
  const selectedRows = useMemo(
    () => catalogue.filter((r) => selected.has(r.id)),
    [catalogue, selected],
  )

  const filterCount: Record<Filter, number> = {
    all: total,
    selected: selCount,
    available: availCount,
  }

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-3)",
        boxShadow: "var(--shadow-1)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 22px",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <Icon name="Sparkles" size={16} />
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Amenities
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--ink-faint)" }}
          >
            · {selCount} of {total} selected
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => {
            const on = filter === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: "var(--r-pill)",
                  background: on ? "var(--ink)" : "var(--paper)",
                  color: on ? "var(--linen)" : "var(--ink-soft)",
                  border: on
                    ? "1px solid var(--ink)"
                    : "1px solid var(--line)",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 12,
                  fontWeight: on ? 600 : 500,
                }}
              >
                {FILTER_LABELS[f]}
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    opacity: 0.8,
                  }}
                >
                  {filterCount[f]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Currently selected strip */}
      {selCount > 0 && (
        <div
          style={{
            padding: "14px 22px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--linen-soft)",
          }}
        >
          <div
            className="caps"
            style={{
              color: "var(--ink-faint)",
              fontSize: 10,
              letterSpacing: "var(--tracked)",
              marginBottom: 8,
            }}
          >
            Currently selected · {selCount}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedRows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onToggle(r.id)}
                title="Remove"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px 6px 12px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--ink)",
                  color: "var(--linen)",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                <Icon name="Check" size={11} strokeWidth={2.4} />
                {r.name}
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "rgba(251,248,243,.16)",
                    color: "var(--linen)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 2,
                  }}
                >
                  <Icon name="X" size={9} strokeWidth={2.5} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--line-soft)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--r-pill)",
            padding: "8px 14px",
          }}
        >
          <Icon name="Search" size={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search amenities — wifi, pool, breakfast…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              font: "inherit",
              fontSize: 13,
              color: "var(--ink)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-faint)",
                padding: "2px 4px",
              }}
            >
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
        {selCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-soft)",
              fontSize: 12.5,
              font: "inherit",
              padding: "6px 10px",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Grouped chip grid */}
      <div style={{ padding: "8px 22px 22px" }}>
        {grouped.length === 0 ? (
          <div
            style={{
              padding: "32px 12px",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: 13.5,
            }}
          >
            {catalogue.length === 0
              ? "No amenities in the catalogue yet."
              : "No amenities match this search."}
          </div>
        ) : (
          grouped.map((g, gi) => {
            const gTotal = catalogue.filter((r) => r.category === g.category).length
            const gSel = catalogue.filter(
              (r) => r.category === g.category && selected.has(r.id),
            ).length
            return (
              <div
                key={g.category}
                style={{
                  padding: "18px 0",
                  borderTop:
                    gi > 0 ? "1px solid var(--line-soft)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 12,
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
                    {g.category}
                  </div>
                  <span
                    className="mono"
                    style={{ fontSize: 9.5, color: "var(--ink-faint)" }}
                  >
                    · {gSel} of {gTotal}
                  </span>
                  <span style={{ flex: 1 }} />
                  {gSel > 0 && (
                    <span
                      style={{
                        width: 18,
                        height: 6,
                        borderRadius: 3,
                        overflow: "hidden",
                        background: "var(--line-soft)",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: `${(gSel / gTotal) * 100}%`,
                          background: "var(--teal)",
                        }}
                      />
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.items.map((r) => {
                    const on = selected.has(r.id)
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onToggle(r.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 12px",
                          borderRadius: "var(--r-pill)",
                          background: on
                            ? "var(--linen-soft)"
                            : "var(--paper)",
                          color: on ? "var(--ink)" : "var(--ink-soft)",
                          border: on
                            ? "1px solid var(--ink)"
                            : "1px solid var(--line)",
                          cursor: "pointer",
                          font: "inherit",
                          fontSize: 12,
                          fontWeight: on ? 600 : 400,
                          transition: "background .12s, border-color .12s",
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            background: on ? "var(--ink)" : "transparent",
                            border: on
                              ? "none"
                              : "1.5px solid var(--line-strong)",
                            color: "var(--linen)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {on && <Icon name="Check" size={9} strokeWidth={2.8} />}
                        </span>
                        {r.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
