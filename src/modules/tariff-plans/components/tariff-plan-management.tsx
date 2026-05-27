"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createTariffPlan,
  updateTariffPlan,
  deleteTariffPlan,
} from "../actions"
import type {
  Option,
  TariffPlanRow,
  TariffStatus,
} from "../types"
import {
  NewTariffPlanModal,
  EditTariffPlanModal,
} from "./tariff-plan-modal"

const GRID =
  "minmax(180px, 2fr) 130px minmax(160px, 1.5fr) minmax(160px, 1.5fr) minmax(160px, 1.5fr) 110px 200px"

const STATUS_TONE: Record<TariffStatus, "ok" | "neutral"> = {
  active: "ok",
  inactive: "neutral",
}
const STATUS_LABEL: Record<TariffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

function sortByName(rows: TariffPlanRow[]): TariffPlanRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function TariffPlanManagement({
  initialPlans,
  tariffOptions,
  propertyOptions,
  roomTypeOptions,
}: {
  initialPlans: TariffPlanRow[]
  tariffOptions: Option[]
  propertyOptions: Option[]
  roomTypeOptions: Option[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<TariffPlanRow[]>(initialPlans)
  const [syncedFrom, setSyncedFrom] = useState(initialPlans)
  if (initialPlans !== syncedFrom) {
    setSyncedFrom(initialPlans)
    setRows(initialPlans)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | TariffStatus>("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<TariffPlanRow | null>(null)
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
        r.tariffBeginningPriceName.toLowerCase().includes(s) ||
        r.roomTypeName.toLowerCase().includes(s) ||
        (r.propertyName ?? "").toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, statusFilter])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createTariffPlan>[0]) => {
      const res = await createTariffPlan(values)
      if (res.ok) {
        setRows((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateTariffPlan>[1]) => {
      const res = await updateTariffPlan(id, values)
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
    async (r: TariffPlanRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `Code ${r.code}. The tariff will be removed from the list.`,
        confirmLabel: "Delete tariff",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteTariffPlan(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Tariff deleted",
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
          Tariff
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New tariff
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
            placeholder="Search name, code, room type, property"
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
            setStatusFilter(e.target.value as "" | TariffStatus)
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
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1180 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Code</span>
              <span style={{ color: "var(--ink-faint)" }}>Tariff</span>
              <span style={{ color: "var(--ink-faint)" }}>Property</span>
              <span style={{ color: "var(--ink-faint)" }}>Room Type</span>
              <span style={{ color: "var(--ink-faint)" }}>Status</span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}></span>
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
                  ? "No tariffs yet. Add the first one."
                  : "No tariffs match this search."}
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
                    {r.code}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {r.tariffBeginningPriceName}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {r.propertyName ?? (
                      <span style={{ fontStyle: "italic" }}>Unknown</span>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {r.roomTypeName}
                  </span>
                  <span>
                    <Pill tone={STATUS_TONE[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Pill>
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

      <NewTariffPlanModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
        tariffOptions={tariffOptions}
        propertyOptions={propertyOptions}
        roomTypeOptions={roomTypeOptions}
      />
      <EditTariffPlanModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        plan={editRow}
        onSave={handleUpdate}
        tariffOptions={tariffOptions}
        propertyOptions={propertyOptions}
        roomTypeOptions={roomTypeOptions}
      />
    </div>
  )
}
