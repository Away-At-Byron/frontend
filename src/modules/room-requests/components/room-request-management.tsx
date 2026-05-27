"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createRoomRequest,
  updateRoomRequest,
  deleteRoomRequest,
} from "../actions"
import type { RoomRequestRow } from "../types"
import {
  NewRoomRequestModal,
  EditRoomRequestModal,
} from "./room-request-modal"

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

function sortByName(rows: RoomRequestRow[]): RoomRequestRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function RoomRequestManagement({
  initialRequests,
}: {
  initialRequests: RoomRequestRow[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<RoomRequestRow[]>(initialRequests)
  const [syncedFrom, setSyncedFrom] = useState(initialRequests)
  if (initialRequests !== syncedFrom) {
    setSyncedFrom(initialRequests)
    setRows(initialRequests)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<RoomRequestRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        (r.code ?? "").toLowerCase().includes(s),
    )
  }, [rows, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createRoomRequest>[0]) => {
      const res = await createRoomRequest(values)
      if (res.ok) {
        setRows((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateRoomRequest>[1]) => {
      const res = await updateRoomRequest(id, values)
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
    async (r: RoomRequestRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The room request will be removed from the list.`,
        confirmLabel: "Delete room request",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteRoomRequest(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Room request deleted",
          message: `${r.name} has been removed.`,
        })
      } else {
        toast.error({
          title: "Could not delete",
          message: res.error.message,
        })
      }
      setDeletingId(null)
    },
    [router, confirm, toast],
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
          Room Requests
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New room request
        </Button>
      </div>

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
          placeholder="Search by requirement or code"
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
          <div style={{ minWidth: 940 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Requirement</span>
              <span style={{ color: "var(--ink-faint)" }}>Code</span>
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
                  ? "No room requests yet. Add the first one."
                  : "No room requests match this search."}
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
                  <span
                    className="mono"
                    style={{ fontSize: 12.5, color: "var(--ink-soft)" }}
                  >
                    {r.code ?? "-"}
                  </span>
                  <span>
                    <Pill tone={r.usageCount > 0 ? "info" : "neutral"}>
                      {r.usageCount}
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

      <NewRoomRequestModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditRoomRequestModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        request={editRow}
        onSave={handleUpdate}
      />
    </div>
  )
}
