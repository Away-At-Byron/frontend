"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button, FilterPill, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import type { PropertyRow, PropertyStatus } from "../types"

type FilterId = "all" | PropertyStatus

const FILTER_LABELS: Record<FilterId, string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
}

function formatAddress(p: PropertyRow): string {
  const parts = [
    p.addressStreet,
    p.addressSuburb,
    p.addressCity,
    p.addressPostcode,
  ].filter((s): s is string => Boolean(s && s.trim()))
  return parts.length ? parts.join(", ") : "—"
}

export function PropertyManagement({
  initialProperties,
}: {
  initialProperties: PropertyRow[]
}) {
  const [filter, setFilter] = useState<FilterId>("all")
  const [search, setSearch] = useState("")

  const counts = useMemo(
    () => ({
      all: initialProperties.length,
      active: initialProperties.filter((p) => p.status === "active").length,
      inactive: initialProperties.filter((p) => p.status === "inactive").length,
    }),
    [initialProperties],
  )

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return initialProperties.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false
      if (!s) return true
      return (
        p.name.toLowerCase().includes(s) ||
        formatAddress(p).toLowerCase().includes(s)
      )
    })
  }, [initialProperties, filter, search])

  return (
    <div
      style={{
        padding: "24px 32px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: "var(--tight)",
            margin: 0,
          }}
        >
          Properties
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(FILTER_LABELS) as FilterId[]).map((id) => (
          <FilterPill
            key={id}
            on={filter === id}
            count={counts[id]}
            onClick={() => setFilter(id)}
          >
            {FILTER_LABELS[id]}
          </FilterPill>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-pill)",
            padding: "9px 14px",
            flex: "1 1 280px",
            maxWidth: 400,
          }}
        >
          <Icon name="Search" size={15} />
          <input
            placeholder="Search properties, suburbs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Button variant="paper" icon={<Icon name="File" size={15} />}>
            Export
          </Button>
          <Link
            href="/properties/new"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            <Button variant="primary" icon={<Icon name="Plus" size={15} />}>
              Add property
            </Button>
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "40px 22px",
            textAlign: "center",
            color: "var(--ink-soft)",
            fontSize: 14,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-3)",
          }}
        >
          No properties match this filter.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property: p }: { property: PropertyRow }) {
  const accent = p.propertyColour ?? "var(--teal)"
  return (
    <Link
      href={`/properties/${p.id}`}
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-3)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-1)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ height: 6, background: accent }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          minHeight: 180,
        }}
      >
        <div
          style={{
            background: "var(--linen)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-faint)",
          }}
        >
          <Icon name="House" size={28} />
        </div>
        <div
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10.5,
                  color: "var(--ink-faint)",
                }}
              >
                {p.id.slice(0, 8)}
              </span>
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 22,
                  fontWeight: 300,
                  letterSpacing: "var(--tight)",
                  marginTop: 3,
                  lineHeight: 1.1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </div>
            </div>
            <Pill tone={p.status === "active" ? "ok" : "warn"} size="sm">
              {p.status}
            </Pill>
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12.5,
              color: "var(--ink-soft)",
            }}
          >
            {formatAddress(p)}
          </div>
          <div
            style={{
              marginTop: "auto",
              paddingTop: 14,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Pill tone="paper" size="sm">
              <Icon name="Bed" size={11} /> {p.numberOfRooms} rooms
            </Pill>
            <span
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                color: "var(--ink-soft)",
              }}
            >
              Edit <Icon name="ArrowRight" size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
