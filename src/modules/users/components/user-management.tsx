"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Avatar, Button, Card, FilterPill, IconButton, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import type { RoleOption, UserRow } from "../queries"
import { createUser, updateUser, disableUser } from "../actions"
import { NewUserModal, labelFor } from "./new-user-modal"
import { EditUserModal } from "./edit-user-modal"

export function UserManagement({
  initialUsers,
  roles,
  currentUserId,
}: {
  initialUsers: UserRow[]
  roles: RoleOption[]
  currentUserId: string
}) {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [syncedFrom, setSyncedFrom] = useState(initialUsers)
  // Reconcile with fresh server data after router.refresh() — the
  // React-sanctioned "adjust state during render" pattern (no effect).
  if (initialUsers !== syncedFrom) {
    setSyncedFrom(initialUsers)
    setUsers(initialUsers)
  }
  const [activeTab, setActiveTab] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 300 ms debounced search (old app behaviour).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase()
    return users.filter((u) => {
      if (activeTab !== "all" && u.roleName !== activeTab) return false
      if (statusFilter === "active" && u.status !== "active") return false
      if (statusFilter === "inactive" && u.status === "active") return false
      if (!s) return true
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      )
    })
  }, [users, activeTab, statusFilter, debounced])

  const handleCreate = useCallback(
    async (values: Parameters<typeof createUser>[0]) => {
      setError(null)
      const res = await createUser(values)
      if (res.ok) {
        setUsers((prev) => [res.data, ...prev])
        router.refresh()
      }
      return res
    },
    [router],
  )

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateUser>[1]) => {
      setError(null)
      const before = users.find((u) => u.id === id)
      const res = await updateUser(id, values)
      if (res.ok) {
        const roleChanged = before && before.roleId !== res.data.roleId
        setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)))
        // Self-edit safeguard: changing your own role invalidates your
        // session — sign out (old app behaviour, adapted to Auth.js).
        if (id === currentUserId && roleChanged) {
          await signOut({ callbackUrl: "/signin" })
          return res
        }
        router.refresh()
      }
      return res
    },
    [users, currentUserId, router],
  )

  const handleDisable = useCallback(
    async (u: UserRow) => {
      if (
        !window.confirm(
          `Disable ${u.firstName} ${u.lastName}? They will no longer be able to sign in.`,
        )
      )
        return
      setDeletingId(u.id)
      setError(null)
      const res = await disableUser(u.id)
      if (res.ok) {
        // Keep the row visible as inactive (status filter handles hiding).
        setUsers((prev) =>
          prev.map((x) => (x.id === u.id ? { ...x, status: "disabled" } : x)),
        )
      } else {
        setError(res.error.message)
      }
      setDeletingId(null)
    },
    [],
  )

  const tabs = useMemo(
    () => [{ id: "all", label: "All" }, ...roles.map((r) => ({ id: r.name, label: labelFor(r.name) }))],
    [roles],
  )

  return (
    <div style={{ padding: "24px 32px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: "var(--r-2)",
            background: "var(--bad-bg)",
            color: "var(--bad-fg)",
            fontSize: 13.5,
          }}
        >
          {error}
          <IconButton size={28} variant="quiet" title="Dismiss" onClick={() => setError(null)}>
            <Icon name="X" size={14} />
          </IconButton>
        </div>
      )}

      {/* Row 1 — filter by role, full width */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
        <span
          className="caps"
          style={{ color: "var(--ink-faint)", width: 56, flex: "0 0 56px" }}
        >
          Role
        </span>
        {tabs.map((t) => (
          <FilterPill
            key={t.id}
            on={activeTab === t.id}
            count={
              t.id === "all"
                ? users.length
                : users.filter((u) => u.roleName === t.id).length
            }
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </FilterPill>
        ))}
      </div>

      {/* Row 2 — status filter (start) · search + new user (end) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            className="caps"
            style={{ color: "var(--ink-faint)", width: 56, flex: "0 0 56px" }}
          >
            Status
          </span>
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ] as const
          ).map((s) => (
            <FilterPill
              key={s.id}
              on={statusFilter === s.id}
              count={
                s.id === "all"
                  ? users.length
                  : s.id === "active"
                    ? users.filter((u) => u.status === "active").length
                    : users.filter((u) => u.status !== "active").length
              }
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </FilterPill>
          ))}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
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
              width: 280,
            }}
          >
            <Icon name="Search" size={15} />
            <input
              placeholder="Search users"
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
          <Button
            variant="primary"
            icon={<Icon name="Plus" size={15} />}
            onClick={() => setNewOpen(true)}
          >
            New user
          </Button>
        </div>
      </div>

      <Card pad={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.6fr 1fr 0.9fr 150px",
            gap: 16,
            padding: "14px 22px",
            borderBottom: "1px solid var(--line-soft)",
          }}
          className="caps"
        >
          <span style={{ color: "var(--ink-faint)" }}>Name</span>
          <span style={{ color: "var(--ink-faint)" }}>Email</span>
          <span style={{ color: "var(--ink-faint)" }}>Role</span>
          <span style={{ color: "var(--ink-faint)" }}>Status</span>
          <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>
            No users match this filter.
          </div>
        ) : (
          filtered.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1.6fr 1fr 0.9fr 150px",
                gap: 16,
                alignItems: "center",
                padding: "14px 22px",
                borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <Avatar name={`${u.firstName} ${u.lastName}`} size={34} tint="shell" />
                <span style={{ fontFamily: "var(--font-display), serif", fontSize: 15.5 }}>
                  {u.firstName} {u.lastName}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {u.email}
              </span>
              <span>
                <Pill tone={u.roleName === "admin" ? "ink" : "neutral"}>{labelFor(u.roleName)}</Pill>
              </span>
              <span>
                <Pill tone={u.status === "active" ? "ok" : u.status === "locked" ? "warn" : "bad"}>
                  {u.status}
                </Pill>
              </span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button size="sm" variant="ghost" onClick={() => setEditUser(u)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={
                    deletingId === u.id ||
                    u.id === currentUserId ||
                    u.status === "disabled"
                  }
                  onClick={() => handleDisable(u)}
                >
                  {deletingId === u.id ? "..." : "Disable"}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <NewUserModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        roles={roles}
        onSave={handleCreate}
      />
      <EditUserModal
        isOpen={editUser !== null}
        onClose={() => setEditUser(null)}
        roles={roles}
        user={editUser}
        onSave={handleUpdate}
      />
    </div>
  )
}
