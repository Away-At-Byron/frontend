"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import {
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "../actions"
import type { RoomTypeRow } from "../types"
import { NewRoomTypeModal, EditRoomTypeModal } from "./room-type-modal"

// Header row + every data row share this track so the columns line up.
const GRID = "minmax(220px, 2fr) 140px 130px 150px 150px 150px"

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortByName(rows: RoomTypeRow[]): RoomTypeRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function RoomTypeManagement({
  initialTypes,
}: {
  initialTypes: RoomTypeRow[]
}) {
  const router = useRouter()
  const [types, setTypes] = useState<RoomTypeRow[]>(initialTypes)
  const [syncedFrom, setSyncedFrom] = useState(initialTypes)
  if (initialTypes !== syncedFrom) {
    setSyncedFrom(initialTypes)
    setTypes(initialTypes)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editType, setEditType] = useState<RoomTypeRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    if (!s) return types
    return types.filter((t) => t.name.toLowerCase().includes(s))
  }, [types, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createRoomType>[0]) => {
      setError(null)
      const res = await createRoomType(values)
      if (res.ok) {
        setTypes((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateRoomType>[1]) => {
      setError(null)
      const res = await updateRoomType(id, values)
      if (res.ok) {
        setTypes((prev) =>
          sortByName(prev.map((t) => (t.id === id ? res.data : t))),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleDelete = useCallback(
    async (t: RoomTypeRow) => {
      const inUse =
        t.roomCount > 0
          ? ` ${t.roomCount} room${
              t.roomCount === 1 ? "" : "s"
            } will keep this type on their record.`
          : ""
      if (!window.confirm(`Delete the "${t.name}" room type?${inUse}`)) return
      setDeletingId(t.id)
      setError(null)
      const res = await deleteRoomType(t.id)
      if (res.ok) {
        setTypes((prev) => prev.filter((x) => x.id !== t.id))
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
      {/* Page header - title (start) · New button (end) */}
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
          Room Types
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New room type
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
          placeholder="Search room types"
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
          <div style={{ minWidth: 900 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Max Occupancy</span>
              <span style={{ color: "var(--ink-faint)" }}>In Use</span>
              <span style={{ color: "var(--ink-faint)" }}>Created</span>
              <span style={{ color: "var(--ink-faint)" }}>Updated</span>
              <span
                style={{ color: "var(--ink-faint)", textAlign: "right" }}
              ></span>
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
                {types.length === 0
                  ? "No room types yet. Add the first one."
                  : "No room types match this search."}
              </div>
            ) : (
              filtered.map((t, i) => (
                <div
                  key={t.id}
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
                    {t.name}
                  </span>
                  <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
                    {t.defaultMaxOccupancy ?? "-"}
                  </span>
                  <span>
                    <Pill tone={t.roomCount > 0 ? "info" : "neutral"}>
                      {t.roomCount} room{t.roomCount === 1 ? "" : "s"}
                    </Pill>
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(t.createdAt)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(t.updatedAt)}
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
                      onClick={() => setEditType(t)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingId === t.id}
                      onClick={() => handleDelete(t)}
                    >
                      {deletingId === t.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewRoomTypeModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditRoomTypeModal
        isOpen={editType !== null}
        onClose={() => setEditType(null)}
        roomType={editType}
        onSave={handleUpdate}
      />
    </div>
  )
}
