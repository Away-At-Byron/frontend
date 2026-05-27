"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createCostCategory,
  updateCostCategory,
  deleteCostCategory,
} from "../actions"
import type { CostCategoryRow, CostTypeOption } from "../types"
import { BASIS_LABEL } from "../schemas"
import {
  NewCostCategoryModal,
  EditCostCategoryModal,
} from "./cost-category-modal"

const GRID =
  "minmax(180px, 2fr) minmax(180px, 2fr) 150px 130px 110px 200px"
const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})

function formatAmount(r: CostCategoryRow): { value: string; inherited: boolean } {
  if (r.isOverridden) {
    if (r.basis === "percentage") {
      return { value: `${r.amountInt / 100}%`, inherited: false }
    }
    return { value: AUD.format(r.amountInt / 100), inherited: false }
  }
  // Inherited: cost_types.default_rate_cents is always cents regardless of basis.
  return { value: AUD.format(r.costTypeDefaultRateCents / 100), inherited: true }
}

function sortRows(rows: CostCategoryRow[]): CostCategoryRow[] {
  return [...rows].sort((a, b) => {
    const t = a.costTypeName.localeCompare(b.costTypeName)
    return t !== 0 ? t : a.name.localeCompare(b.name)
  })
}

export function CostCategoryManagement({
  initialCategories,
  costTypeOptions,
}: {
  initialCategories: CostCategoryRow[]
  costTypeOptions: CostTypeOption[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<CostCategoryRow[]>(initialCategories)
  const [syncedFrom, setSyncedFrom] = useState(initialCategories)
  if (initialCategories !== syncedFrom) {
    setSyncedFrom(initialCategories)
    setRows(initialCategories)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [costTypeFilter, setCostTypeFilter] = useState<string>("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<CostCategoryRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return rows.filter((r) => {
      if (costTypeFilter && r.costTypeId !== costTypeFilter) return false
      if (!s) return true
      return (
        r.name.toLowerCase().includes(s) ||
        r.costTypeName.toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, costTypeFilter])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createCostCategory>[0]) => {
      const res = await createCostCategory(values)
      if (res.ok) {
        setRows((prev) => sortRows([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateCostCategory>[1]) => {
      const res = await updateCostCategory(id, values)
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
    async (r: CostCategoryRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The "${r.name}" cost category will be removed from ${r.costTypeName}.`,
        confirmLabel: "Delete cost category",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteCostCategory(r.id)
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Cost category deleted",
          message: `${r.name} has been removed from ${r.costTypeName}.`,
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
          Cost Categories
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New cost category
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
            placeholder="Search by name or cost type"
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
          value={costTypeFilter}
          onChange={(e) => setCostTypeFilter(e.target.value)}
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
          <option value="">All cost types</option>
          {costTypeOptions.map((o) => (
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
              <span style={{ color: "var(--ink-faint)" }}>Cost type</span>
              <span style={{ color: "var(--ink-faint)" }}>Basis</span>
              <span style={{ color: "var(--ink-faint)" }}>Amount</span>
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
                  ? "No cost categories yet. Add the first one."
                  : "No cost categories match this search."}
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
                    {r.costTypeName}
                  </span>
                  <span style={{ fontSize: 13 }}>{BASIS_LABEL[r.basis]}</span>
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 13.5 }}>
                      {formatAmount(r).value}
                    </span>
                    {formatAmount(r).inherited && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          fontStyle: "italic",
                        }}
                      >
                        inherited
                      </span>
                    )}
                  </span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Pill tone={r.isActive ? "ok" : "neutral"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Pill>
                    {r.isOverridden && <Pill tone="neutral">Override</Pill>}
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

      <NewCostCategoryModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
        costTypeOptions={costTypeOptions}
      />
      <EditCostCategoryModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        category={editRow}
        onSave={handleUpdate}
        costTypeOptions={costTypeOptions}
      />
    </div>
  )
}
