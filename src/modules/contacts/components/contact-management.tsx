"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, Button, Card, FilterPill, IconButton, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import {
  type ContactRow,
  type ContactTier,
  type ContactTypeOption,
  CONTACT_TIER_LABELS,
} from "../types"
import { birthdaysThisMonth, formatBirthday } from "../utils"
import { createContact, updateContact } from "../actions"
import { NewContactModal, EditContactModal } from "./contact-modal"
import type { CreateContactInput, UpdateContactInput } from "../schemas"

type FilterId = "all" | "birthdays" | "vip" | "returning" | "in_house"

const FILTER_LABELS: Record<FilterId, string> = {
  all: "All",
  birthdays: "Birthdays this month",
  vip: "VIP",
  returning: "Returning",
  in_house: "In-house & upcoming",
}

const GRID = "1.5fr 1fr 1.2fr 0.9fr 0.5fr 0.7fr 0.7fr 0.8fr 90px"

function tierTone(tier: ContactTier) {
  if (tier === "vip") return "accent" as const
  if (tier === "gold") return "ok" as const
  return "neutral" as const
}

function exportCsv(rows: ContactRow[]) {
  const header = [
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Type",
    "Tier",
    "Birthday",
    "Stays",
  ]
  const lines = rows.map((r) =>
    [
      r.firstName,
      r.lastName,
      r.email ?? "",
      r.phone ?? "",
      r.contactTypeName ?? "",
      r.tier ? CONTACT_TIER_LABELS[r.tier] : "",
      formatBirthday(r.birthday) ?? "",
      String(r.stayCount),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  )
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ContactManagement({
  initialContacts,
  contactTypes,
}: {
  initialContacts: ContactRow[]
  contactTypes: ContactTypeOption[]
}) {
  const router = useRouter()
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts)
  const [syncedFrom, setSyncedFrom] = useState(initialContacts)
  if (initialContacts !== syncedFrom) {
    setSyncedFrom(initialContacts)
    setContacts(initialContacts)
  }

  const [activeFilter, setActiveFilter] = useState<FilterId>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editContact, setEditContact] = useState<ContactRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const birthdayRows = useMemo(() => birthdaysThisMonth(contacts), [contacts])

  const counts = useMemo(
    () => ({
      all: contacts.length,
      birthdays: birthdayRows.length,
      vip: contacts.filter((c) => c.tier === "vip").length,
      returning: contacts.filter((c) => c.returningGuest).length,
      in_house: 0,
    }),
    [contacts, birthdayRows],
  )

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return contacts.filter((c) => {
      if (activeFilter === "birthdays" && !birthdayRows.some((b) => b.id === c.id)) return false
      if (activeFilter === "vip" && c.tier !== "vip") return false
      if (activeFilter === "returning" && !c.returningGuest) return false
      if (activeFilter === "in_house") return false
      if (!s) return true
      return (
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
        (c.email?.toLowerCase().includes(s) ?? false) ||
        (c.phone?.toLowerCase().includes(s) ?? false)
      )
    })
  }, [contacts, activeFilter, debounced, birthdayRows])

  const handleCreate = useCallback(
    async (values: CreateContactInput) => {
      setError(null)
      const res = await createContact(values)
      if (res.ok) {
        setContacts((prev) => [...prev, res.data].sort((a, b) => a.lastName.localeCompare(b.lastName)))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: UpdateContactInput) => {
      setError(null)
      const res = await updateContact(id, values)
      if (res.ok) {
        setContacts((prev) =>
          prev
            .map((c) => (c.id === id ? res.data : c))
            .sort((a, b) => a.lastName.localeCompare(b.lastName)),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  return (
    <div style={{ padding: "24px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
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
          Contacts
        </h1>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: "var(--r-2)",
            background: "var(--bad-bg)",
            color: "var(--bad-fg)",
            fontSize: 13.5,
          }}
        >
          {error}
          <IconButton size={28} variant="quiet" title="Dismiss" onClick={() => setError(null)}>
            <Icon name="X" size={14} />
          </IconButton>
        </div>
      )}

      {/* Birthdays this month */}
      <Card surface="shell" pad={20}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 140 }}>
            <div className="caps" style={{ color: "var(--ink-faint)" }}>
              Birthdays this month
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 36,
                marginTop: 8,
              }}
            >
              {birthdayRows.length} guest{birthdayRows.length === 1 ? "" : "s"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {birthdayRows.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  width: "fit-content",
                  paddingLeft: 4,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  background: "var(--shell)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-pill)",
                }}
              >
                <Avatar name={`${c.firstName} ${c.lastName}`} size={32} tint="teal" />
                <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap" }}>
                    {c.firstName} {c.lastName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-soft)",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span aria-hidden>🎂</span>
                    {formatBirthday(c.birthday)}
                  </span>
                </span>
              </div>
            ))}
            {birthdayRows.length === 0 && (
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>No birthdays this month.</span>
            )}
          </div>
          <Button variant="ghost" iconRight={<Icon name="ArrowRight" size={14} />}>
            Send birthday offers
          </Button>
        </div>
      </Card>

      {/* Filters + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(FILTER_LABELS) as FilterId[]).map((id) => (
          <FilterPill
            key={id}
            on={activeFilter === id}
            count={counts[id]}
            onClick={() => setActiveFilter(id)}
          >
            {FILTER_LABELS[id]}
          </FilterPill>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            placeholder="Search name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <Button
            variant="paper"
            icon={<Icon name="Sparkline" size={15} />}
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
          >
            Export
          </Button>
          <Button
            variant="primary"
            icon={<Icon name="Plus" size={15} />}
            onClick={() => setNewOpen(true)}
          >
            New contact
          </Button>
        </div>
      </div>

      <Card pad={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "14px 22px",
            borderBottom: "1px solid var(--line-soft)",
          }}
          className="caps"
        >
          <span style={{ color: "var(--ink-faint)" }}>Name</span>
          <span style={{ color: "var(--ink-faint)" }}>Type</span>
          <span style={{ color: "var(--ink-faint)" }}>Email</span>
          <span style={{ color: "var(--ink-faint)" }}>Phone</span>
          <span style={{ color: "var(--ink-faint)" }}>Stays</span>
          <span style={{ color: "var(--ink-faint)" }}>Tier</span>
          <span style={{ color: "var(--ink-faint)" }}>Birthday</span>
          <span style={{ color: "var(--ink-faint)" }}>Last stay</span>
          <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>
            No contacts match this filter.
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                alignItems: "center",
                padding: "14px 22px",
                borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar name={`${c.firstName} ${c.lastName}`} size={34} tint="shell" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display), serif", fontSize: 15.5 }}>
                    {c.firstName} {c.lastName}
                  </div>
                </div>
              </div>
              <span style={{ color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.contactTypeName ?? "—"}
              </span>
              <span style={{ color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.email ?? "—"}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{c.phone ?? "—"}</span>
              <span>{c.stayCount}</span>
              <span>
                {c.tier ? (
                  <Pill tone={tierTone(c.tier)}>{CONTACT_TIER_LABELS[c.tier]}</Pill>
                ) : (
                  <span style={{ color: "var(--ink-faint)" }}>—</span>
                )}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{formatBirthday(c.birthday) ?? "—"}</span>
              <span style={{ color: "var(--ink-soft)" }}>{c.lastStayLabel ?? "—"}</span>
              <div style={{ textAlign: "right" }}>
                <Button size="sm" variant="ghost" onClick={() => setEditContact(c)}>
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <NewContactModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        contactTypes={contactTypes}
        onSave={handleCreate}
      />
      <EditContactModal
        isOpen={editContact !== null}
        onClose={() => setEditContact(null)}
        contact={editContact}
        contactTypes={contactTypes}
        onSave={handleUpdate}
      />
    </div>
  )
}
