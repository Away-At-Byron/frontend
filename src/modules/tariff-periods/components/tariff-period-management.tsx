"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createTariffPeriod,
  updateTariffPeriod,
  deleteTariffPeriod,
} from "../actions"
import type { TariffPeriodRow } from "../types"
import {
  NewTariffPeriodModal,
  EditTariffPeriodModal,
} from "./tariff-period-modal"

// Header row + every data row share this track so the columns line up.
const GRID = "140px minmax(220px, 2fr) 130px 130px 150px"

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

function sortByFromDate(rows: TariffPeriodRow[]): TariffPeriodRow[] {
  return [...rows].sort(
    (a, b) =>
      a.fromDate.localeCompare(b.fromDate) || a.code.localeCompare(b.code),
  )
}

export function TariffPeriodManagement({
  initialPeriods,
}: {
  initialPeriods: TariffPeriodRow[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [periods, setPeriods] = useState<TariffPeriodRow[]>(initialPeriods)
  const [syncedFrom, setSyncedFrom] = useState(initialPeriods)
  // Reconcile with fresh server data after router.refresh().
  if (initialPeriods !== syncedFrom) {
    setSyncedFrom(initialPeriods)
    setPeriods(initialPeriods)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editPeriod, setEditPeriod] = useState<TariffPeriodRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    if (!s) return periods
    return periods.filter(
      (p) =>
        p.code.toLowerCase().includes(s) ||
        (p.description ?? "").toLowerCase().includes(s),
    )
  }, [periods, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createTariffPeriod>[0]) => {
      const res = await createTariffPeriod(values)
      if (res.ok) {
        setPeriods((prev) => sortByFromDate([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateTariffPeriod>[1]) => {
      const res = await updateTariffPeriod(id, values)
      if (res.ok) {
        setPeriods((prev) =>
          sortByFromDate(prev.map((p) => (p.id === id ? res.data : p))),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleDelete = useCallback(
    async (p: TariffPeriodRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${p.code}?`,
        message: "The tariff period will be removed from the list.",
        confirmLabel: "Delete tariff period",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(p.id)
      const res = await deleteTariffPeriod(p.id)
      if (res.ok) {
        setPeriods((prev) => prev.filter((x) => x.id !== p.id))
        router.refresh()
        toast.success({
          title: "Tariff period deleted",
          message: `${p.code} has been removed.`,
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
          Tariff Periods
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New tariff period
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
          width: 280,
        }}
      >
        <Icon name="Search" size={15} />
        <input
          placeholder="Search tariff periods"
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
              <span style={{ color: "var(--ink-faint)" }}>Code</span>
              <span style={{ color: "var(--ink-faint)" }}>Description</span>
              <span style={{ color: "var(--ink-faint)" }}>From</span>
              <span style={{ color: "var(--ink-faint)" }}>To</span>
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
                {periods.length === 0
                  ? "No tariff periods yet. Add the first one."
                  : "No tariff periods match this search."}
              </div>
            ) : (
              filtered.map((p, i) => (
                <div
                  key={p.id}
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
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13.5,
                      color: "var(--ink)",
                    }}
                  >
                    {p.code}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: p.description ? "var(--ink)" : "var(--ink-faint)",
                    }}
                  >
                    {p.description ?? "—"}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(p.fromDate)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(p.toDate)}
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
                      onClick={() => setEditPeriod(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p)}
                    >
                      {deletingId === p.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewTariffPeriodModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditTariffPeriodModal
        isOpen={editPeriod !== null}
        onClose={() => setEditPeriod(null)}
        period={editPeriod}
        onSave={handleUpdate}
      />
    </div>
  )
}
