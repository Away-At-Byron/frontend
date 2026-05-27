"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import {
  createPropertyAmenity,
  updatePropertyAmenity,
  deletePropertyAmenity,
  reorderPropertyAmenity,
} from "../actions"
import type { PropertyAmenityRow } from "../types"
import {
  NewPropertyAmenityModal,
  EditPropertyAmenityModal,
} from "./property-amenity-modal"

const GRID = "minmax(200px, 2fr) minmax(220px, 3fr) 110px 140px 64px 200px"

// IconButton in our primitives has no `disabled` prop; small local button
// covers the reorder controls (matches the quiet IconButton look).
function ReorderButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  title: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: "var(--ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  )
}

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortRows(rows: PropertyAmenityRow[]): PropertyAmenityRow[] {
  return [...rows].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}

/** Apply the up-or-down server result to the local rows, then re-sort. */
function withSwap(
  rows: PropertyAmenityRow[],
  id: string,
  next: PropertyAmenityRow,
): PropertyAmenityRow[] {
  // The server renormalised the whole category, so a single-row swap on the
  // client is not enough. We rely on router.refresh() to bring the canonical
  // ordering down. In the meantime, update the moved row optimistically.
  return sortRows(rows.map((r) => (r.id === id ? next : r)))
}

export function PropertyAmenityManagement({
  initialAmenities,
  initialCategories,
}: {
  initialAmenities: PropertyAmenityRow[]
  initialCategories: string[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<PropertyAmenityRow[]>(initialAmenities)
  const [syncedRows, setSyncedRows] = useState(initialAmenities)
  if (initialAmenities !== syncedRows) {
    setSyncedRows(initialAmenities)
    setRows(initialAmenities)
  }
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [syncedCats, setSyncedCats] = useState(initialCategories)
  if (initialCategories !== syncedCats) {
    setSyncedCats(initialCategories)
    setCategories(initialCategories)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [newOpen, setNewOpen] = useState(false)
  const [newDefaultCategory, setNewDefaultCategory] = useState<string | undefined>(undefined)
  const [editRow, setEditRow] = useState<PropertyAmenityRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return rows.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false
      if (!s) return true
      return (
        r.name.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, categoryFilter])

  // Group filtered rows by category so we can show category headers and so
  // the Up/Down boundary check (first/last in category) is straightforward.
  const grouped = useMemo(() => {
    const groups: { category: string; items: PropertyAmenityRow[] }[] = []
    for (const r of filtered) {
      const last = groups[groups.length - 1]
      if (last && last.category === r.category) {
        last.items.push(r)
      } else {
        groups.push({ category: r.category, items: [r] })
      }
    }
    return groups
  }, [filtered])

  const refreshCategoriesFrom = useCallback((next: PropertyAmenityRow[]) => {
    const set = new Set<string>()
    for (const r of next) set.add(r.category)
    setCategories(Array.from(set).sort((a, b) => a.localeCompare(b)))
  }, [])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createPropertyAmenity>[0]) => {
      const res = await createPropertyAmenity(values)
      if (res.ok) {
        const next = sortRows([...rows, res.data])
        setRows(next)
        refreshCategoriesFrom(next)
        router.refresh()
      }
      return res
    },
    [router, rows, refreshCategoriesFrom],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updatePropertyAmenity>[1]) => {
      const res = await updatePropertyAmenity(id, values)
      if (res.ok) {
        const next = sortRows(rows.map((r) => (r.id === id ? res.data : r)))
        setRows(next)
        refreshCategoriesFrom(next)
        router.refresh()
      }
      return res
    },
    [router, rows, refreshCategoriesFrom],
  )

  const handleDelete = useCallback(
    async (r: PropertyAmenityRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The "${r.name}" amenity will be removed from ${r.category}.`,
        confirmLabel: "Delete amenity",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deletePropertyAmenity(r.id)
      if (res.ok) {
        const next = rows.filter((x) => x.id !== r.id)
        setRows(next)
        refreshCategoriesFrom(next)
        router.refresh()
        toast.success({
          title: "Amenity deleted",
          message: `${r.name} has been removed from ${r.category}.`,
        })
      } else {
        toast.error({
          title: "Could not delete",
          message: res.error.message,
        })
      }
      setDeletingId(null)
    },
    [router, rows, refreshCategoriesFrom, confirm, toast],
  )

  const handleMove = useCallback(
    async (r: PropertyAmenityRow, direction: "up" | "down") => {
      setMovingId(r.id)
      const res = await reorderPropertyAmenity(r.id, direction)
      if (res.ok) {
        setRows((prev) => withSwap(prev, r.id, res.data))
        router.refresh()
      } else {
        toast.error({
          title: "Could not reorder",
          message: res.error.message,
        })
      }
      setMovingId(null)
    },
    [router, toast],
  )

  const filterOptions = useMemo(() => {
    const set = new Set<string>(categories)
    for (const r of rows) set.add(r.category)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [categories, rows])

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
          Property Amenities
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => {
            setNewDefaultCategory(categoryFilter || undefined)
            setNewOpen(true)
          }}
        >
          New amenity
        </Button>
      </div>

      {/* Search + category filter */}
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
            placeholder="Search amenities or categories"
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
          {filterOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
              <span style={{ color: "var(--ink-faint)" }}>Category</span>
              <span style={{ color: "var(--ink-faint)" }}>Name</span>
              <span style={{ color: "var(--ink-faint)" }}>In Use</span>
              <span style={{ color: "var(--ink-faint)" }}>Updated</span>
              <span style={{ color: "var(--ink-faint)" }}>Order</span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}></span>
            </div>

            {grouped.length === 0 ? (
              <div
                style={{
                  padding: "40px 22px",
                  textAlign: "center",
                  color: "var(--ink-soft)",
                  fontSize: 14,
                }}
              >
                {rows.length === 0
                  ? "No amenities yet. Add the first one."
                  : "No amenities match this search."}
              </div>
            ) : (
              grouped.map((g, gi) => (
                <div key={g.category}>
                  {g.items.map((r, i) => {
                    const isFirst = i === 0
                    const isLast = i === g.items.length - 1
                    const isMoving = movingId === r.id
                    return (
                      <div
                        key={r.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: GRID,
                          gap: 16,
                          alignItems: "center",
                          padding: "12px 22px",
                          borderTop:
                            gi === 0 && i === 0
                              ? "none"
                              : "1px solid var(--line-soft)",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                          {r.category}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display), serif",
                            fontSize: 15.5,
                          }}
                        >
                          {r.name}
                        </span>
                        <span>
                          <Pill tone={r.usageCount > 0 ? "info" : "neutral"}>
                            {r.usageCount}
                          </Pill>
                        </span>
                        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                          {formatDate(r.updatedAt)}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <ReorderButton
                            title="Move up"
                            disabled={isFirst || isMoving}
                            onClick={() => handleMove(r, "up")}
                          >
                            <Icon name="ChevronUp" size={14} />
                          </ReorderButton>
                          <ReorderButton
                            title="Move down"
                            disabled={isLast || isMoving}
                            onClick={() => handleMove(r, "down")}
                          >
                            <Icon name="ChevronDown" size={14} />
                          </ReorderButton>
                        </div>
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
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewPropertyAmenityModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
        categories={categories}
        defaultCategory={newDefaultCategory}
      />
      <EditPropertyAmenityModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        amenity={editRow}
        onSave={handleUpdate}
        categories={categories}
      />
    </div>
  )
}
