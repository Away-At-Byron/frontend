"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { createTariff, updateTariff, deleteTariff } from "../actions"
import { TARIFF_TRAFFIC_LABEL } from "../schemas"
import type { TariffRow } from "../types"
import { NewTariffModal, EditTariffModal } from "./tariff-modal"

const GRID = "minmax(220px, 2fr) 130px 130px 150px 150px 150px"

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortByName(rows: TariffRow[]): TariffRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

export function TariffManagement({
  initialTariffs,
}: {
  initialTariffs: TariffRow[]
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [rows, setRows] = useState<TariffRow[]>(initialTariffs)
  const [syncedFrom, setSyncedFrom] = useState(initialTariffs)
  if (initialTariffs !== syncedFrom) {
    setSyncedFrom(initialTariffs)
    setRows(initialTariffs)
  }

  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<TariffRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    async (values: Parameters<typeof createTariff>[0]) => {
      const res = await createTariff(values)
      if (res.ok) {
        setRows((prev) => sortByName([...prev, res.data]))
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateTariff>[1]) => {
      const res = await updateTariff(id, values)
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
    async (r: TariffRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${r.name}?`,
        message: `The tariff will be removed from the list.`,
        confirmLabel: "Delete tariff",
        cancelLabel: "Cancel",
      })
      if (!ok) return
      setDeletingId(r.id)
      const res = await deleteTariff(r.id)
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
          Tariff Type
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New tariff
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
          placeholder="Search tariffs"
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
          <div style={{ minWidth: 1000 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Traffic</span>
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
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {TARIFF_TRAFFIC_LABEL[r.traffic]}
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

      <NewTariffModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditTariffModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        tariff={editRow}
        onSave={handleUpdate}
      />
    </div>
  )
}
