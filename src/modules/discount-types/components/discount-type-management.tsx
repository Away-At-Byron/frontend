"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createDiscountType,
  updateDiscountType,
  deleteDiscountType,
} from "../actions"
import type {
  DiscountKind,
  DiscountStatus,
  DiscountTypeRow,
} from "../types"
import {
  NewDiscountTypeModal,
  EditDiscountTypeModal,
} from "./discount-type-modal"

const GRID =
  "auto minmax(160px, 1fr) 130px 130px 200px auto 200px"

function formatDate(value: Date | string | null): string {
  if (!value) return "-"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatValue(row: DiscountTypeRow): string {
  // value_int is 0..10000 basis points for percentage, cents otherwise.
  const dec = row.valueInt / 100
  if (row.type === "percentage") return `${dec}%`
  const dollars = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dec)
  return row.type === "cashback" ? `${dollars} cashback` : dollars
}

function formatDuration(row: DiscountTypeRow): string {
  if (row.activationMode === "manual") return "Manual"
  const start = row.durationStart ? formatDate(row.durationStart) : "Open"
  const end = row.durationEnd ? formatDate(row.durationEnd) : "Open"
  return `${start} → ${end}`
}

const STATUS_TONE: Record<DiscountStatus, "ok" | "warn" | "neutral" | "info"> = {
  active: "ok",
  scheduled: "info",
  expired: "neutral",
  paused: "warn",
}
const STATUS_LABEL: Record<DiscountStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  paused: "Paused",
}

const KIND_LABEL: Record<DiscountKind, string> = {
  percentage: "Percentage",
  flat: "Flat",
  cashback: "Cashback",
}

function sortByName(rows: DiscountTypeRow[]): DiscountTypeRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function DiscountTypeManagement({
  initialDiscounts,
}: {
  initialDiscounts: DiscountTypeRow[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<DiscountTypeRow[]>(initialDiscounts)
  const [syncedFrom, setSyncedFrom] = useState(initialDiscounts)
  if (initialDiscounts !== syncedFrom) {
    setSyncedFrom(initialDiscounts)
    setRows(initialDiscounts)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | DiscountStatus>("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<DiscountTypeRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (!s) return true
      return (
        r.name.toLowerCase().includes(s) ||
        r.code.toLowerCase().includes(s) ||
        (r.description ?? "").toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, statusFilter])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createDiscountType>[0]) => {
      const res = await createDiscountType(values)
      if (res.ok) {
        setRows((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateDiscountType>[1]) => {
      const res = await updateDiscountType(id, values)
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
    async (r: DiscountTypeRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `Code ${r.code}. Bookings that already used it keep the saving.`,
        confirmLabel: "Delete discount",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteDiscountType(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Discount deleted",
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
          Discount Types
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New discount
        </Button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
            placeholder="Search by name, code or description"
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
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | DiscountStatus)
          }
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-pill)",
            padding: "9px 14px",
            font: "inherit",
            fontSize: 13,
            color: "var(--ink)",
            minWidth: 180,
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              columnGap: 16,
              minWidth: 1100,
            }}
          >
            <div
              style={{ display: "contents" }}
              className="caps"
            >
              <span style={{ color: "var(--ink-faint)", padding: "14px 0 14px 22px", borderBottom: "1px solid var(--line-soft)" }}>Code</span>
              <span style={{ color: "var(--ink-faint)", padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>Name</span>
              <span style={{ color: "var(--ink-faint)", padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>Type</span>
              <span style={{ color: "var(--ink-faint)", padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>Value</span>
              <span style={{ color: "var(--ink-faint)", padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>Duration</span>
              <span style={{ color: "var(--ink-faint)", padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>Status</span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right", padding: "14px 22px 14px 0", borderBottom: "1px solid var(--line-soft)" }}></span>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "40px 22px",
                  textAlign: "center",
                  color: "var(--ink-soft)",
                  fontSize: 14,
                }}
              >
                {rows.length === 0
                  ? "No discounts yet. Add the first one."
                  : "No discounts match this search."}
              </div>
            ) : (
              filtered.map((r, i) => {
                const cellStyle = {
                  padding: "14px 0",
                  borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                  alignSelf: "center" as const,
                }
                return (
                  <div key={r.id} style={{ display: "contents" }}>
                    <span
                      className="mono"
                      style={{
                        ...cellStyle,
                        padding: "14px 0 14px 22px",
                        fontSize: 12.5,
                        color: "var(--ink-soft)",
                      }}
                    >
                      {r.code}
                    </span>
                    <span
                      style={{
                        ...cellStyle,
                        fontFamily: "var(--font-display), serif",
                        fontSize: 15.5,
                      }}
                    >
                      {r.name}
                    </span>
                    <span style={{ ...cellStyle, fontSize: 13, color: "var(--ink-soft)" }}>
                      {KIND_LABEL[r.type]}
                    </span>
                    <span style={{ ...cellStyle, fontSize: 13.5 }}>{formatValue(r)}</span>
                    <span style={{ ...cellStyle, fontSize: 13, color: "var(--ink-soft)" }}>
                      {formatDuration(r)}
                    </span>
                    <span style={cellStyle}>
                      <Pill tone={STATUS_TONE[r.status]}>
                        {STATUS_LABEL[r.status]}
                      </Pill>
                    </span>
                    <div
                      style={{
                        ...cellStyle,
                        padding: "14px 22px 14px 0",
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
                )
              })
            )}
          </div>
        </div>
      </Card>

      <NewDiscountTypeModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditDiscountTypeModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        discount={editRow}
        onSave={handleUpdate}
      />
    </div>
  )
}
