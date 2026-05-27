"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import {
  createRoomConfiguration,
  updateRoomConfiguration,
  deleteRoomConfiguration,
} from "../actions"
import type { RoomConfigurationRow } from "../types"
import {
  NewRoomConfigurationModal,
  EditRoomConfigurationModal,
} from "./room-configuration-modal"

// Wider name column - configuration strings can be long.
const GRID = "minmax(300px, 2fr) 140px 130px 150px 150px 150px"

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortByName(rows: RoomConfigurationRow[]): RoomConfigurationRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function RoomConfigurationManagement({
  initialConfigurations,
}: {
  initialConfigurations: RoomConfigurationRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState<RoomConfigurationRow[]>(initialConfigurations)
  const [syncedFrom, setSyncedFrom] = useState(initialConfigurations)
  if (initialConfigurations !== syncedFrom) {
    setSyncedFrom(initialConfigurations)
    setRows(initialConfigurations)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<RoomConfigurationRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(s))
  }, [rows, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createRoomConfiguration>[0]) => {
      setError(null)
      const res = await createRoomConfiguration(values)
      if (res.ok) {
        setRows((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateRoomConfiguration>[1]) => {
      setError(null)
      const res = await updateRoomConfiguration(id, values)
      if (res.ok) {
        setRows((prev) =>
          sortByName(prev.map((r) => (r.id === id ? res.data : r))),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleDelete = useCallback(
    async (r: RoomConfigurationRow) => {
      const inUse =
        r.roomCount > 0
          ? ` ${r.roomCount} room${
              r.roomCount === 1 ? "" : "s"
            } will keep this configuration on their record.`
          : ""
      if (
        !window.confirm(`Delete the "${r.name}" room configuration?${inUse}`)
      )
        return
      setDeletingId(r.id)
      setError(null)
      const res = await deleteRoomConfiguration(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
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
          Room Configurations
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New room configuration
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-pill)",
          padding: "9px 14px",
          width: 320,
        }}
      >
        <Icon name="Search" size={15} />
        <input
          placeholder="Search room configurations"
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
          <div style={{ minWidth: 980 }}>
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
                {rows.length === 0
                  ? "No room configurations yet. Add the first one."
                  : "No room configurations match this search."}
              </div>
            ) : (
              filtered.map((r, i) => (
                <div
                  key={r.id}
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
                    {r.name}
                  </span>
                  <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
                    {r.defaultMaxOccupancy ?? "-"}
                  </span>
                  <span>
                    <Pill tone={r.roomCount > 0 ? "info" : "neutral"}>
                      {r.roomCount} room{r.roomCount === 1 ? "" : "s"}
                    </Pill>
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(r.createdAt)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(r.updatedAt)}
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
                      onClick={() => setEditRow(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingId === r.id}
                      onClick={() => handleDelete(r)}
                    >
                      {deletingId === r.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewRoomConfigurationModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditRoomConfigurationModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        roomConfiguration={editRow}
        onSave={handleUpdate}
      />
    </div>
  )
}
