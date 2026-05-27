"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/dialog";
import { createGroup, updateGroup, deleteGroup } from "../group-actions";
import type { CreateGroupInput, UpdateGroupInput } from "../schemas";
import type { GroupRow } from "../types";
import { NewGroupModal, EditGroupModal } from "./group-modal";

// Name · Company / agent · Members · Created · Actions
const GRID = "minmax(220px, 2fr) 1.4fr 130px 150px 170px";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortByName(rows: GroupRow[]): GroupRow[] {
  return [...rows].sort((a, b) => a.groupName.localeCompare(b.groupName));
}

export function GroupManagement({
  initialGroups,
  canDelete,
}: {
  initialGroups: GroupRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [groups, setGroups] = useState<GroupRow[]>(initialGroups);
  const [syncedFrom, setSyncedFrom] = useState(initialGroups);
  // Reconcile with fresh server data after router.refresh().
  if (initialGroups !== syncedFrom) {
    setSyncedFrom(initialGroups);
    setGroups(initialGroups);
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) => {
      return (
        g.groupName.toLowerCase().includes(s) ||
        (g.companyName?.toLowerCase().includes(s) ?? false) ||
        (g.travelAgentId?.toLowerCase().includes(s) ?? false) ||
        (g.corporateAccountId?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [groups, debounced]);

  const handleCreate = useCallback(
    async (values: CreateGroupInput) => {
      const res = await createGroup(values);
      if (res.ok) {
        setGroups((prev) => sortByName([...prev, res.data]));
        router.refresh();
        toast.success({
          title: "Group added",
          message: `${res.data.groupName} is ready for members.`,
        });
      }
      return res;
    },
    [router, toast],
  );

  const handleUpdate = useCallback(
    async (id: string, values: UpdateGroupInput) => {
      const res = await updateGroup(id, values);
      if (res.ok) {
        setGroups((prev) =>
          sortByName(prev.map((g) => (g.id === id ? res.data : g))),
        );
        router.refresh();
        toast.success({
          title: "Group updated",
          message: `${res.data.groupName} saved.`,
        });
      }
      return res;
    },
    [router, toast],
  );

  const handleDelete = useCallback(
    async (g: GroupRow) => {
      const inUse =
        g.memberCount > 0
          ? ` ${g.memberCount} member${
              g.memberCount === 1 ? "" : "s"
            } will keep this group on their record.`
          : "";
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${g.groupName}?`,
        message: `The group will be removed from the list.${inUse}`,
        confirmLabel: "Delete group",
        cancelLabel: "Cancel",
      });
      if (!ok) return;

      setDeletingId(g.id);
      const res = await deleteGroup(g.id);
      if (res.ok) {
        setGroups((prev) => prev.filter((x) => x.id !== g.id));
        router.refresh();
        toast.success({
          title: "Group deleted",
          message: `${g.groupName} has been removed.`,
        });
      } else {
        toast.error({
          title: "Couldn't delete group",
          message: res.error.message,
        });
      }
      setDeletingId(null);
    },
    [router, confirm, toast],
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
          Groups
        </h1>
        <Button
          variant="primary"
          icon={<Icon name="Plus" size={15} />}
          onClick={() => setNewOpen(true)}
        >
          New group
        </Button>
      </div>

      {/* Search */}
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
          placeholder="Search name, company or agent"
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
        {searchTerm && (
          <IconButton
            size={22}
            variant="quiet"
            title="Clear search"
            onClick={() => setSearchTerm("")}
          >
            <Icon name="X" size={12} />
          </IconButton>
        )}
      </div>

      <Card pad={0}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 880 }}>
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
              <span style={{ color: "var(--ink-faint)" }}>Group name</span>
              <span style={{ color: "var(--ink-faint)" }}>Company / agent</span>
              <span style={{ color: "var(--ink-faint)" }}>Members</span>
              <span style={{ color: "var(--ink-faint)" }}>Created</span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>
                Action
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
                {groups.length === 0
                  ? "No groups yet. Add the first one."
                  : "No groups match this search."}
              </div>
            ) : (
              filtered.map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 22px",
                    borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
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
                      {g.groupName}
                    </span>
                    {g.relationships && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--ink-soft)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {g.relationships}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                    {g.companyName ?? g.travelAgentId ?? "-"}
                  </span>
                  <span>
                    <Pill tone={g.memberCount > 0 ? "info" : "neutral"}>
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                    </Pill>
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {formatDate(g.createdAt)}
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
                      onClick={() => setEditGroup(g)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={!canDelete || deletingId === g.id}
                      onClick={() => handleDelete(g)}
                    >
                      {deletingId === g.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <NewGroupModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSave={handleCreate}
      />
      <EditGroupModal
        isOpen={editGroup !== null}
        onClose={() => setEditGroup(null)}
        group={editGroup}
        onSave={handleUpdate}
      />
    </div>
  );
}
