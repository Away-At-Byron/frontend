"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import {
  createContactSource,
  updateContactSource,
  deleteContactSource,
} from "../actions"
import type { ContactSourceRow } from "../types"
import {
  NewContactSourceModal,
  EditContactSourceModal,
} from "./contact-source-modal"

// Header row + every data row share this track so the columns line up.
const GRID = "minmax(220px, 2fr) 130px 150px 150px 150px"

/** "14 Aug 2024" — short, day-first (en-AU). */
function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortByName(rows: ContactSourceRow[]): ContactSourceRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function ContactSourceManagement({
  initialSources,
}: {
  initialSources: ContactSourceRow[]
}) {
  const router = useRouter()
  const [sources, setSources] = useState<ContactSourceRow[]>(initialSources)
  const [syncedFrom, setSyncedFrom] = useState(initialSources)
  // Reconcile with fresh server data after router.refresh() — the
  // React-sanctioned "adjust state during render" pattern (no effect).
  if (initialSources !== syncedFrom) {
    setSyncedFrom(initialSources)
    setSources(initialSources)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editSource, setEditSource] = useState<ContactSourceRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 300 ms debounced search, matching the other management screens.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    if (!s) return sources
    return sources.filter((t) => t.name.toLowerCase().includes(s))
  }, [sources, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createContactSource>[0]) => {
      setError(null)
      const res = await createContactSource(values)
      if (res.ok) {
        setSources((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateContactSource>[1]) => {
      setError(null)
      const res = await updateContactSource(id, values)
      if (res.ok) {
        setSources((prev) =>
          sortByName(prev.map((t) => (t.id === id ? res.data : t))),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleDelete = useCallback(
    async (s: ContactSourceRow) => {
      const inUse =
        s.contactCount > 0
          ? ` ${s.contactCount} contact${
              s.contactCount === 1 ? "" : "s"
            } will keep this source on their record.`
          : ""
      if (
        !window.confirm(`Delete the "${s.name}" contact source?${inUse}`)
      )
        return
      setDeletingId(s.id)
      setError(null)
      const res = await deleteContactSource(s.id)
      if (res.ok) {
        setSources((prev) => prev.filter((x) => x.id !== s.id))
        router.refresh()
      } else {
        setError(res.error.message)
      }
      setDeletingId(null)
    },
    [router],
  )

  return (
    <div
      style={{
        padding: "24px 32px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Page header — title (start) · New button (end) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: "var(--tight)",
            margin: 0,
          }}
        >
          Contact Sources
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New contact source
        </Button>
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
          <IconButton
            size={28}
            variant="quiet"
            title="Dismiss"
            onClick={() => setError(null)}
          >
            <Icon name="X" size={14} />
          </IconButton>
        </div>
      )}

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-pill)",
          padding: "9px 14px",
          width: 280,
        }}
      >
        <Icon name="Search" size={15} />
        <input
          placeholder="Search contact sources"
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

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 800 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 16,
                padding: "14px 22px",
                borderBottom: "1px solid var(--line-soft)",
              }}
              className="caps"
            >
              <span style={{ color: "var(--ink-faint)" }}>Name</span>
              <span style={{ color: "var(--ink-faint)" }}>In Use</span>
              <span style={{ color: "var(--ink-faint)" }}>Created</span>
              <span style={{ color: "var(--ink-faint)" }}>Updated</span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>
                {/* Actions */}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "40px 22px",
                  textAlign: "center",
                  color: "var(--ink-soft)",
                  fontSize: 14,
                }}
              >
                {sources.length === 0
                  ? "No contact sources yet. Add the first one."
                  : "No contact sources match this search."}
              </div>
            ) : (
              filtered.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 22px",
                    borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontSize: 15.5,
                    }}
                  >
                    {s.name}
                  </span>
                  <span>
                    <Pill tone={s.contactCount > 0 ? "info" : "neutral"}>
                      {s.contactCount} contact
                      {s.contactCount === 1 ? "" : "s"}
                    </Pill>
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(s.createdAt)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(s.updatedAt)}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditSource(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingId === s.id}
                      onClick={() => handleDelete(s)}
                    >
                      {deletingId === s.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewContactSourceModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditContactSourceModal
        isOpen={editSource !== null}
        onClose={() => setEditSource(null)}
        contactSource={editSource}
        onSave={handleUpdate}
      />
    </div>
  )
}
