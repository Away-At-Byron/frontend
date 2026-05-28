"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createCostType,
  updateCostType,
  deleteCostType,
} from "../actions"
import type { CostTypeRow, Option } from "../types"
import { BASIS_LABEL } from "../schemas"
import { NewCostTypeModal, EditCostTypeModal } from "./cost-type-modal"

const GRID =
  "minmax(200px, 2fr) minmax(160px, 1.5fr) 150px 130px 160px 200px"
const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})

function formatDefaultValue(r: CostTypeRow): string {
  if (r.basis === "percentage") return `${r.defaultValueInt / 100}%`
  return AUD.format(r.defaultValueInt / 100)
}

function sortRows(rows: CostTypeRow[]): CostTypeRow[] {
  return [...rows].sort((a, b) => {
    const c = a.costCategoryName.localeCompare(b.costCategoryName)
    return c !== 0 ? c : a.name.localeCompare(b.name)
  })
}

export function CostTypeManagement({
  initialCostTypes,
  costCategoryOptions,
}: {
  initialCostTypes: CostTypeRow[]
  costCategoryOptions: Option[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<CostTypeRow[]>(initialCostTypes)
  const [syncedFrom, setSyncedFrom] = useState(initialCostTypes)
  if (initialCostTypes !== syncedFrom) {
    setSyncedFrom(initialCostTypes)
    setRows(initialCostTypes)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<CostTypeRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return rows.filter((r) => {
      if (categoryFilter && r.costCategoryId !== categoryFilter) return false
      if (!s) return true
      return (
        r.name.toLowerCase().includes(s) ||
        r.costCategoryName.toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, categoryFilter])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createCostType>[0]) => {
      const res = await createCostType(values)
      if (res.ok) {
        setRows((prev) => sortRows([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateCostType>[1]) => {
      const res = await updateCostType(id, values)
      if (res.ok) {
        setRows((prev) =>
          sortRows(prev.map((r) => (r.id === id ? res.data : r))),
        )
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleDelete = useCallback(
    async (r: CostTypeRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The cost type will be removed from ${r.costCategoryName}. Bookings that already used it keep their record.`,
        confirmLabel: "Delete cost type",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteCostType(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Cost type deleted",
          message: `${r.name} has been removed from ${r.costCategoryName}.`,
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
          Cost Types
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New cost type
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
            placeholder="Search by name or category"
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-pill)",
            padding: "9px 14px",
            font: "inherit",
            fontSize: 13,
            color: "var(--ink)",
            minWidth: 220,
          }}
        >
          <option value="">All categories</option>
          {costCategoryOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1080 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Category</span>
              <span style={{ color: "var(--ink-faint)" }}>Basis</span>
              <span style={{ color: "var(--ink-faint)" }}>Default</span>
              <span style={{ color: "var(--ink-faint)" }}>Status</span>
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
                  ? "No cost types yet. Add the first one."
                  : "No cost types match this search."}
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
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {r.costCategoryName}
                  </span>
                  <span style={{ fontSize: 13 }}>{BASIS_LABEL[r.basis]}</span>
                  <span style={{ fontSize: 13.5 }}>
                    {formatDefaultValue(r)}
                  </span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Pill tone={r.isActive ? "ok" : "neutral"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Pill>
                    {r.canBeOverridden && (
                      <Pill tone="neutral">Overridable</Pill>
                    )}
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

      <NewCostTypeModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
        costCategoryOptions={costCategoryOptions}
      />
      <EditCostTypeModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        costType={editRow}
        onSave={handleUpdate}
        costCategoryOptions={costCategoryOptions}
      />
    </div>
  )
}
