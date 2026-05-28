"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useConfirm } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { createTariff, updateTariff, deleteTariff } from "../actions"
import {
  TARIFF_BASIS_LABEL,
  TARIFF_STATUS_LABEL,
  TARIFF_TRAFFIC_LABEL,
  type TariffStatus,
} from "../schemas"
import type { Option, TariffRow } from "../types"
import { NewTariffModal, EditTariffModal } from "./tariff-modal"

const GRID =
  "minmax(180px, 1.6fr) auto 130px minmax(160px, 1.4fr) minmax(140px, 1.1fr) 130px auto 200px"

const STATUS_TONE: Record<TariffStatus, "ok" | "neutral"> = {
  active: "ok",
  inactive: "neutral",
}

function sortByName(rows: TariffRow[]): TariffRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

function propertyLabel(r: TariffRow): string {
  if (!r.propertyId) return "All properties"
  return r.propertyName ?? "Unknown"
}

export function TariffManagement({
  initialTariffs,
  propertyOptions,
  tariffPeriodOptions,
}: {
  initialTariffs: TariffRow[]
  propertyOptions: Option[]
  tariffPeriodOptions: Option[]
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
  const [statusFilter, setStatusFilter] = useState<"" | TariffStatus>("")
  const [newOpen, setNewOpen] = useState(false)
  const [editRow, setEditRow] = useState<TariffRow | null>(null)
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
        propertyLabel(r).toLowerCase().includes(s)
      )
    })
  }, [rows, debounced, statusFilter])

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
        message: `Code ${r.code}. The tariff will be removed from the list.`,
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
            placeholder="Search name, code, property"
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              columnGap: 16,
              minWidth: 1280,
            }}
          >
            <div style={{ display: "contents" }} className="caps">
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0 14px 22px",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Name
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Code
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Basis
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Property
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Period
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Traffic
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Status
              </span>
              <span
                style={{
                  color: "var(--ink-faint)",
                  padding: "14px 22px 14px 0",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              />
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
                  ? "No tariffs yet. Add the first one."
                  : "No tariffs match this search."}
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
                      style={{
                        ...cellStyle,
                        padding: "14px 0 14px 22px",
                        fontFamily: "var(--font-display), serif",
                        fontSize: 15.5,
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      className="mono"
                      style={{
                        ...cellStyle,
                        fontSize: 12.5,
                        color: "var(--ink-soft)",
                      }}
                    >
                      {r.code}
                    </span>
                    <span
                      style={{ ...cellStyle, fontSize: 13, color: "var(--ink-soft)" }}
                    >
                      {TARIFF_BASIS_LABEL[r.tariffBasis]}
                    </span>
                    <span
                      style={{ ...cellStyle, fontSize: 13, color: "var(--ink-soft)" }}
                    >
                      {!r.propertyId ? (
                        <span style={{ fontStyle: "italic" }}>All properties</span>
                      ) : (
                        (r.propertyName ?? (
                          <span style={{ fontStyle: "italic" }}>Unknown</span>
                        ))
                      )}
                    </span>
                    <span
                      className={r.tariffPeriodCode ? "mono" : undefined}
                      style={{
                        ...cellStyle,
                        fontSize: r.tariffPeriodCode ? 12.5 : 13,
                        color: "var(--ink-soft)",
                      }}
                    >
                      {r.tariffPeriodCode ?? (
                        <span style={{ fontStyle: "italic" }}>None</span>
                      )}
                    </span>
                    <span
                      style={{ ...cellStyle, fontSize: 13, color: "var(--ink-soft)" }}
                    >
                      {TARIFF_TRAFFIC_LABEL[r.traffic]}
                    </span>
                    <span style={cellStyle}>
                      <Pill tone={STATUS_TONE[r.status]}>
                        {TARIFF_STATUS_LABEL[r.status]}
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

      <NewTariffModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
        propertyOptions={propertyOptions}
        tariffPeriodOptions={tariffPeriodOptions}
      />
      <EditTariffModal
        isOpen={editRow !== null}
        onClose={() => setEditRow(null)}
        tariff={editRow}
        onSave={handleUpdate}
        propertyOptions={propertyOptions}
        tariffPeriodOptions={tariffPeriodOptions}
      />
    </div>
  )
}
