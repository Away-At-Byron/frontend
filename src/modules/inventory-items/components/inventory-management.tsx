"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Card, FilterPill, Pill, Stat } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { deleteInventoryItem } from "../actions"
import type {
  InventoryItemRow,
  InventoryItemType,
} from "../types"
import { STATUS_LABEL } from "../types"

type TabId = InventoryItemType
const TABS: { id: TabId; label: string }[] = [
  { id: "asset", label: "Assets" },
  { id: "inventory", label: "Inventory" },
  { id: "consumable", label: "Consumables" },
]

const MONEY = new Intl.NumberFormat("en-AU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function fmtCents(cents: number | null): string {
  if (cents == null) return "—"
  return `$${MONEY.format(cents / 100)}`
}

function fmtDate(value: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function stockTone(r: InventoryItemRow): "ok" | "warn" | "bad" {
  if (r.type === "asset") return "ok"
  const threshold =
    r.type === "inventory" ? r.minimumThreshold : r.reorderLevel
  if (threshold == null) return "ok"
  if (r.quantityOnHand <= 0) return "bad"
  if (r.quantityOnHand < threshold) return "warn"
  return "ok"
}

function isBelowReorder(r: InventoryItemRow): boolean {
  const threshold =
    r.type === "inventory" ? r.minimumThreshold : r.reorderLevel
  return threshold != null && r.quantityOnHand < threshold
}

function stockValueCents(r: InventoryItemRow): number {
  // Asset uses no money column; inventory has replacement_cost, consumable has unit_cost.
  const cents =
    r.type === "inventory"
      ? r.replacementCostCents
      : r.type === "consumable"
        ? r.unitCostCents
        : 0
  return (cents ?? 0) * r.quantityOnHand
}

export function InventoryManagement({
  initialItems,
}: {
  initialItems: InventoryItemRow[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()

  const [items, setItems] = useState<InventoryItemRow[]>(initialItems)
  const [syncedFrom, setSyncedFrom] = useState(initialItems)
  if (initialItems !== syncedFrom) {
    setSyncedFrom(initialItems)
    setItems(initialItems)
  }

  const [tab, setTab] = useState<TabId>("asset")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [belowReorderOnly, setBelowReorderOnly] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(t)
  }, [search])

  const rows = useMemo(
    () => items.filter((r) => r.type === tab),
    [items, tab],
  )

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return rows.filter((r) => {
      if (belowReorderOnly && !isBelowReorder(r)) return false
      if (!s) return true
      return (
        r.name.toLowerCase().includes(s) ||
        (r.supplierName?.toLowerCase().includes(s) ?? false)
      )
    })
  }, [rows, debounced, belowReorderOnly])

  const isAssets = tab === "asset"
  const sumValueCents = rows.reduce((s, r) => s + stockValueCents(r), 0)
  const lowCount = rows.filter(isBelowReorder).length
  const inServiceCount = rows.filter((r) => r.status === "in_service").length

  const handleDelete = useCallback(
    async (r: InventoryItemRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The item will be removed from the inventory catalogue. Past usage records keep their reference.`,
        confirmLabel: "Delete item",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteInventoryItem(r.id)
      if (res.ok) {
        setItems((prev) => prev.filter((x) => x.id !== r.id))
        router.refresh()
        toast.success({
          title: "Item deleted",
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
          Inventory
        </h1>
        <Link
          href={`/inventory/new?type=${tab}`}
          style={{ textDecoration: "none", display: "inline-flex" }}
        >
          <Button variant="primary" icon={<Icon name="Plus" size={15} />}>
            Add item
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 28,
          borderBottom: "1px solid var(--line-soft)",
        }}
        role="tablist"
      >
        {TABS.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.id)
                setBelowReorderOnly(false)
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 2px",
                font: "inherit",
                fontSize: 14,
                fontWeight: on ? 600 : 500,
                color: on ? "var(--ink)" : "var(--ink-soft)",
                borderBottom: on
                  ? "2px solid var(--ink)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {isAssets ? (
          <>
            <Stat
              icon="Dollar"
              label="Quantity on hand"
              value={String(
                rows.reduce((s, r) => s + r.quantityOnHand, 0),
              )}
            />
            <Stat
              icon="Check"
              label="In service"
              value={String(inServiceCount)}
            />
          </>
        ) : (
          <>
            <Stat
              icon="Dollar"
              label={`Stock value · ${tab === "inventory" ? "inventory" : "consumables"}`}
              value={fmtCents(sumValueCents)}
              tone="ok"
            />
            <Stat
              icon="Alert"
              label="Below reorder"
              value={String(lowCount)}
              sub={lowCount > 0 ? "Time to reorder" : undefined}
              tone={lowCount > 0 ? "bad" : undefined}
            />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
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
            placeholder={`Search ${tab === "asset" ? "assets" : tab === "inventory" ? "inventory" : "consumables"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <FilterPill
          on={!belowReorderOnly}
          count={rows.length}
          onClick={() => setBelowReorderOnly(false)}
        >
          All
        </FilterPill>
        {!isAssets && (
          <FilterPill
            on={belowReorderOnly}
            count={lowCount}
            onClick={() => setBelowReorderOnly(true)}
          >
            Below reorder
          </FilterPill>
        )}
      </div>

      <Card pad={0}>
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
              ? `No ${tab === "asset" ? "assets" : tab === "inventory" ? "inventory" : "consumables"} yet. Add the first one.`
              : "No items match this search."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <InventoryTable
              tab={tab}
              rows={filtered}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

type ColumnDef = {
  label: string
  align?: "left" | "right"
  render: (r: InventoryItemRow) => React.ReactNode
}

const idCol: ColumnDef = {
  label: "Item ID",
  render: (r) => (
    <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
      {r.id.slice(0, 8).toUpperCase()}
    </span>
  ),
}
const nameCol: ColumnDef = {
  label: "Name",
  render: (r) => (
    <Link
      href={`/inventory/${r.id}`}
      style={{
        fontFamily: "var(--font-display), serif",
        fontSize: 15,
        color: "var(--ink)",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {r.name}
    </Link>
  ),
}
const categoryCol: ColumnDef = {
  label: "Category",
  render: (r) => (
    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
      {r.category ?? "—"}
    </span>
  ),
}
const qtyCol: ColumnDef = {
  label: "On hand",
  align: "right",
  render: (r) => (
    <span
      style={{
        fontFamily: "var(--font-display), serif",
        fontSize: 15,
        fontStyle: "italic",
      }}
    >
      {r.quantityOnHand}
    </span>
  ),
}
const statusCol: ColumnDef = {
  label: "Status",
  render: (r) => {
    if (r.type === "asset") {
      return <Pill tone="ok">{STATUS_LABEL[r.status]}</Pill>
    }
    const tone = stockTone(r)
    return (
      <Pill tone={tone}>
        {tone === "bad" ? "critical" : tone === "warn" ? "low" : "ok"}
      </Pill>
    )
  },
}

function actionsCol(
  deletingId: string | null,
  onDelete: (r: InventoryItemRow) => void,
): ColumnDef {
  return {
    label: "",
    align: "right",
    render: (r) => {
      const showReorder =
        r.type !== "asset" &&
        ((r.type === "inventory" &&
          r.minimumThreshold != null &&
          r.quantityOnHand < r.minimumThreshold) ||
          (r.type === "consumable" &&
            r.reorderLevel != null &&
            r.quantityOnHand < r.reorderLevel))
      const deleting = deletingId === r.id
      return (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {showReorder ? (
            <Link
              href={`/inventory/${r.id}`}
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              <Button size="sm" variant="primary">
                Reorder
              </Button>
            </Link>
          ) : (
            <Link
              href={`/inventory/${r.id}`}
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              <Button size="sm" variant="ghost">
                Edit
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="danger"
            disabled={deleting}
            onClick={() => onDelete(r)}
          >
            {deleting ? "..." : "Delete"}
          </Button>
        </div>
      )
    },
  }
}

const moneyRight = (cents: number | null) => (
  <span className="mono" style={{ fontSize: 11.5 }}>{fmtCents(cents)}</span>
)
const intRight = (v: number | null) => (
  <span className="mono" style={{ fontSize: 12 }}>{v ?? "—"}</span>
)

function columnsFor(
  tab: TabId,
  deletingId: string | null,
  onDelete: (r: InventoryItemRow) => void,
): ColumnDef[] {
  if (tab === "asset") {
    return [
      idCol,
      nameCol,
      categoryCol,
      qtyCol,
      {
        label: "Warranty expiry",
        render: (r) => (
          <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>
            {fmtDate(r.warrantyExpiry)}
          </span>
        ),
      },
      {
        label: "Useful life",
        render: (r) => (
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {r.expectedUsefulLife ?? "—"}
          </span>
        ),
      },
      statusCol,
      actionsCol(deletingId, onDelete),
    ]
  }
  if (tab === "inventory") {
    return [
      idCol,
      nameCol,
      categoryCol,
      qtyCol,
      { label: "Min threshold", align: "right", render: (r) => intRight(r.minimumThreshold) },
      { label: "Min reorder qty", align: "right", render: (r) => intRight(r.minimumReorderQty) },
      { label: "Replacement cost", align: "right", render: (r) => moneyRight(r.replacementCostCents) },
      statusCol,
      actionsCol(deletingId, onDelete),
    ]
  }
  return [
    idCol,
    nameCol,
    categoryCol,
    qtyCol,
    { label: "Reorder", align: "right", render: (r) => intRight(r.reorderLevel) },
    { label: "Min reorder qty", align: "right", render: (r) => intRight(r.minimumReorderQty) },
    { label: "Unit cost", align: "right", render: (r) => moneyRight(r.unitCostCents) },
    {
      label: "Supplier",
      render: (r) => (
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
          {r.supplierName ?? "—"}
        </span>
      ),
    },
    {
      label: "Last restocked",
      render: (r) => (
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
          {fmtDate(r.lastRestockedDate)}
        </span>
      ),
    },
    statusCol,
    actionsCol(deletingId, onDelete),
  ]
}

function InventoryTable({
  tab,
  rows,
  deletingId,
  onDelete,
}: {
  tab: TabId
  rows: InventoryItemRow[]
  deletingId: string | null
  onDelete: (r: InventoryItemRow) => void
}) {
  const cols = columnsFor(tab, deletingId, onDelete)
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "auto",
      }}
    >
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th
              key={i}
              className="caps"
              style={{
                textAlign: c.align ?? "left",
                color: "var(--ink-faint)",
                fontWeight: 400,
                fontSize: 10.5,
                letterSpacing: "var(--tracked)",
                padding: "14px 14px",
                borderBottom: "1px solid var(--line-soft)",
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={r.id}>
            {cols.map((c, ci) => (
              <td
                key={ci}
                style={{
                  textAlign: c.align ?? "left",
                  padding: "12px 14px",
                  borderTop: ri > 0 ? "1px solid var(--line-soft)" : "none",
                  verticalAlign: "middle",
                }}
              >
                {c.render(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
