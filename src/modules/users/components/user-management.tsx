"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Avatar,
  Button,
  Card,
  FilterPill,
  IconButton,
  Pill,
} from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import type { RoleOption, UserRow } from "../queries";
import { createUser, updateUser, deleteUser } from "../actions";
import { NewUserModal, labelFor } from "./new-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

// Column track shared by the header row and every data row so they align.
// Name is a fixed width sized to its content - an fr max still inflates on a
// wide table. Email is the lone flexible column and soaks up the slack.
const TABLE_GRID = "90px 220px minmax(160px, 1fr) 120px 110px 96px 148px";

// Stable pseudo-random avatar tint per user — same colour on every render.
const AVATAR_TINTS = ["mist", "teal", "terra", "rattan"] as const;

function avatarTint(id: string): (typeof AVATAR_TINTS)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length]!;
}

/** Role badge background — design tokens, not raw hex. */
function roleBg(roleName: string): string {
  if (roleName === "admin") return "var(--shell-deep)";
  if (roleName === "manager") return "var(--mist)";
  if (roleName === "contractor") return "var(--sand)"; // #E6D4B7
  if (roleName === "housekeeper") return "var(--rattan)"; // #A89274
  if (roleName === "other") return "var(--shell)"; // #FBEFE8
  return "var(--paper)";
}

/** "14 Aug 2024" — short, day-first (en-AU). */
function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function exportCsv(rows: UserRow[]) {
  const header = [
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Role",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      r.firstName,
      r.lastName,
      r.email,
      r.phone ?? "",
      labelFor(r.roleName),
      r.status,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function UserManagement({
  initialUsers,
  roles,
  currentUserId,
}: {
  initialUsers: UserRow[];
  roles: RoleOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [syncedFrom, setSyncedFrom] = useState(initialUsers);
  // Reconcile with fresh server data after router.refresh() — the
  // React-sanctioned "adjust state during render" pattern (no effect).
  if (initialUsers !== syncedFrom) {
    setSyncedFrom(initialUsers);
    setUsers(initialUsers);
  }
  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // 300 ms debounced search (old app behaviour).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    return users.filter((u) => {
      if (activeTab !== "all" && u.roleName !== activeTab) return false;
      if (statusFilter === "active" && u.status !== "active") return false;
      if (statusFilter === "inactive" && u.status === "active") return false;
      if (!s) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    });
  }, [users, activeTab, statusFilter, debounced]);

  const handleCreate = useCallback(
    async (values: Parameters<typeof createUser>[0]) => {
      setError(null);
      const res = await createUser(values);
      if (res.ok) {
        setUsers((prev) => [res.data, ...prev]);
        router.refresh();
      }
      return res;
    },
    [router],
  );

  const handleUpdate = useCallback(
    async (id: string, values: Parameters<typeof updateUser>[1]) => {
      setError(null);
      const before = users.find((u) => u.id === id);
      const res = await updateUser(id, values);
      if (res.ok) {
        const roleChanged = before && before.roleId !== res.data.roleId;
        setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
        // Self-edit safeguard: changing your own role invalidates your
        // session — sign out (old app behaviour, adapted to Auth.js).
        if (id === currentUserId && roleChanged) {
          await signOut({ callbackUrl: "/signin" });
          return res;
        }
        router.refresh();
      }
      return res;
    },
    [users, currentUserId, router],
  );

  // Disabling a user is now a status change made through the Edit modal.
  // This is the permanent path: it removes the row. The confirm modal below
  // gates it.
  const handleDelete = useCallback(
    async (u: UserRow) => {
      setDeletingId(u.id);
      setError(null);
      const res = await deleteUser(u.id);
      if (res.ok) {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        router.refresh();
        toast.success({
          title: "User deleted",
          message: `${u.firstName} ${u.lastName} has been removed.`,
        });
      } else {
        toast.error({
          title: "Couldn't delete user",
          message: res.error.message,
        });
      }
      setDeletingId(null);
      setDeleteTarget(null);
    },
    [router, toast],
  );

  const tabs = useMemo(
    () => [
      { id: "all", label: "All" },
      ...roles.map((r) => ({ id: r.name, label: labelFor(r.name) })),
    ],
    [roles],
  );

  return (
    <div
      style={{
        padding: "24px 32px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Page header — title (start) · Export + New user (end) · description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            Users
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="paper"
              icon={<Icon name="Sparkline" size={15} />}
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={15} />}
              onClick={() => setNewOpen(true)}
            >
              New user
            </Button>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            color: "var(--ink-soft)",
            maxWidth: 620,
          }}
        >
          {/* Staff, housekeepers, contractors, admin who have access to the system.
          Manage roles, permissions and onboarding. */}
        </p>
      </div>

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
          <IconButton
            size={28}
            variant="quiet"
            title="Dismiss"
            onClick={() => setError(null)}
          >
            <Icon name="X" size={14} />
          </IconButton>
        </div>
      )}

      {/* Row 1 — role filter · status dropdown, full width */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
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
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-pill)",
              padding: "9px 36px 9px 16px",
              font: "inherit",
              fontSize: 13,
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Icon
            name="ChevronDown"
            size={15}
            style={{ position: "absolute", right: 14, pointerEvents: "none" }}
          />
        </div>
      </div>

      {/* Row 2 — search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
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
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          {/* paddingBottom keeps the last row off the horizontal scrollbar */}
          <div style={{ minWidth: 1200, paddingBottom: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: TABLE_GRID,
                gap: 16,
                padding: "14px 22px",
                borderBottom: "1px solid var(--line-soft)",
              }}
              className="caps"
            >
              <span style={{ color: "var(--ink-faint)" }}>User Id</span>
              <span style={{ color: "var(--ink-faint)" }}>Name</span>
              <span style={{ color: "var(--ink-faint)" }}>Email</span>
              <span style={{ color: "var(--ink-faint)" }}>Phone</span>
              <span style={{ color: "var(--ink-faint)" }}>Role</span>
              <span style={{ color: "var(--ink-faint)" }}>Status</span>
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
                No users match this filter.
              </div>
            ) : (
              filtered.map((u, i) => (
                <div
                  key={u.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: TABLE_GRID,
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 22px",
                    borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <span
                    title={u.id}
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 11,
                      fontWeight: 300,
                      color: "var(--ink-faint)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.id.slice(0, 8)}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <Avatar
                      name={`${u.firstName} ${u.lastName}`}
                      size={36}
                      tint={avatarTint(u.id)}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display), serif",
                          fontSize: 15.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.firstName} {u.lastName}
                      </span>
                      <span
                        style={{ fontSize: 11.5, color: "var(--ink-faint)" }}
                      >
                        Joined {formatDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.email}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {u.phone ?? "—"}
                  </span>
                  <span>
                    <Pill
                      tone="neutral"
                      style={{ background: roleBg(u.roleName) }}
                    >
                      {labelFor(u.roleName)}
                    </Pill>
                  </span>
                  <span>
                    <Pill tone={u.status === "active" ? "ok" : "bad"}>
                      {u.status}
                    </Pill>
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      marginRight: 8,
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditUser(u)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingId === u.id || u.id === currentUserId}
                      onClick={() => setDeleteTarget(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

      {/* Delete confirmation — destructive, permanent. ConfirmDialog (danger)
          replaces window.confirm() and the prior Modal popup. */}
      <ConfirmDialog
        open={deleteTarget !== null}
        tone="danger"
        title={
          deleteTarget
            ? `Delete ${deleteTarget.firstName} ${deleteTarget.lastName}?`
            : "Delete user?"
        }
        message="This permanently removes their account and cannot be undone. To keep the account but block sign-in, use Edit and set the status to Disabled instead."
        confirmLabel={
          deleteTarget && deletingId === deleteTarget.id
            ? "Deleting..."
            : "Delete user"
        }
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteTarget && deletingId === null) handleDelete(deleteTarget);
        }}
        onCancel={() => {
          if (deletingId === null) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
