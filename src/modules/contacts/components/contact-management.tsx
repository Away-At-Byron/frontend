"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  FilterPill,
  IconButton,
  Pill,
} from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import {
  type ContactRow,
  type ContactSourceOption,
  type ContactTier,
  type ContactTypeOption,
  type GroupOption,
  CONTACT_TIERS,
  CONTACT_TIER_LABELS,
} from "../types";
import { birthdaysThisMonth, formatBirthday } from "../utils";
import { createContact, updateContact, deleteContact } from "../actions";
import { NewContactModal, EditContactModal } from "./contact-modal";
import type { CreateContactInput, UpdateContactInput } from "../schemas";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/dialog";

type FilterId = "all" | "birthdays" | "returning";

const FILTER_LABELS: Record<FilterId, string> = {
  all: "All",
  birthdays: "Birthdays this month",
  returning: "Returning",
};

type TierFilter = "all" | ContactTier;
type ContactTypeFilter = "all" | string;

// Client# · Name · Email · Phone · Stays · Tier · Birthday · Last stay · Action
const GRID = "110px 1.9fr 1.5fr 1fr 64px 0.9fr 1fr 1fr 60px";

// Stable pseudo-random avatar tint per contact — the same hashed-id scheme
// the Users table uses, so a contact keeps one colour across renders.
const AVATAR_TINTS = ["mist", "teal", "terra", "rattan"] as const;

function avatarTint(id: string): (typeof AVATAR_TINTS)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length]!;
}

// Tier badge background — one brand token per tier (ADR-002 palette).
const TIER_STYLE: Record<ContactTier, { background: string; color: string }> = {
  bronze: { background: "var(--rattan)", color: "var(--linen)" },
  silver: { background: "var(--mist)", color: "var(--ink)" },
  gold: { background: "var(--sand)", color: "var(--ink)" },
  vip: { background: "var(--terra)", color: "var(--linen)" },
};

function exportCsv(rows: ContactRow[]) {
  const header = [
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Type",
    "Tier",
    "Birthday",
    "Stays",
  ];
  const lines = rows.map((r) =>
    [
      r.firstName,
      r.lastName,
      r.email ?? "",
      r.phone ?? "",
      r.contactTypeName ?? "",
      r.tier ? CONTACT_TIER_LABELS[r.tier] : "",
      formatBirthday(r.birthday) ?? "",
      String(r.stayCount),
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
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RowActionsMenu({
  onEdit,
  onDelete,
  canDelete,
  isDeleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <IconButton
        size={32}
        variant="quiet"
        title="Actions"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="MoreVertical" size={16} />
      </IconButton>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 140,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-2)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 4,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "var(--r-1)",
              font: "inherit",
              fontSize: 13,
              color: "var(--ink)",
              textAlign: "left",
            }}
          >
            <Icon name="Edit" size={14} />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canDelete || isDeleting}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              cursor: !canDelete || isDeleting ? "not-allowed" : "pointer",
              borderRadius: "var(--r-1)",
              font: "inherit",
              fontSize: 13,
              color:
                !canDelete || isDeleting ? "var(--ink-faint)" : "var(--bad-fg)",
              textAlign: "left",
            }}
          >
            <Icon name="Trash" size={14} />
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ContactManagement({
  initialContacts,
  contactTypes,
  contactSources,
  groups,
  canDelete,
}: {
  initialContacts: ContactRow[];
  contactTypes: ContactTypeOption[];
  contactSources: ContactSourceOption[];
  groups: GroupOption[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [syncedFrom, setSyncedFrom] = useState(initialContacts);
  if (initialContacts !== syncedFrom) {
    setSyncedFrom(initialContacts);
    setContacts(initialContacts);
  }

  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [contactTypeFilter, setContactTypeFilter] =
    useState<ContactTypeFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const birthdayRows = useMemo(() => birthdaysThisMonth(contacts), [contacts]);
  // Ids whose birthday falls in the current month — drives the row emphasis.
  const birthdayIds = useMemo(
    () => new Set(birthdayRows.map((r) => r.id)),
    [birthdayRows],
  );

  const counts = useMemo(
    () => ({
      all: contacts.length,
      birthdays: birthdayRows.length,
      returning: contacts.filter((c) => c.returningGuest).length,
    }),
    [contacts, birthdayRows],
  );

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    return contacts.filter((c) => {
      if (
        activeFilter === "birthdays" &&
        !birthdayRows.some((b) => b.id === c.id)
      )
        return false;
      if (activeFilter === "returning" && !c.returningGuest) return false;
      if (tierFilter !== "all" && c.tier !== tierFilter) return false;
      if (contactTypeFilter !== "all" && c.contactTypeId !== contactTypeFilter)
        return false;
      if (!s) return true;
      return (
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
        (c.email?.toLowerCase().includes(s) ?? false) ||
        (c.phone?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [
    contacts,
    activeFilter,
    tierFilter,
    contactTypeFilter,
    debounced,
    birthdayRows,
  ]);

  const handleCreate = useCallback(
    async (values: CreateContactInput) => {
      setError(null);
      const res = await createContact(values);
      if (res.ok) {
        // Newest first — the new contact goes to the top of the list.
        setContacts((prev) => [res.data, ...prev]);
        router.refresh();
      }
      return res;
    },
    [router],
  );

  const handleUpdate = useCallback(
    async (id: string, values: UpdateContactInput) => {
      setError(null);
      const res = await updateContact(id, values);
      if (res.ok) {
        // Keep the row where it is — order is by creation date, not name.
        setContacts((prev) => prev.map((c) => (c.id === id ? res.data : c)));
        router.refresh();
      }
      return res;
    },
    [router],
  );

  const handleDelete = useCallback(
    async (c: ContactRow) => {
      const ok = await confirm({
        tone: "danger",
        title: `Delete ${c.firstName} ${c.lastName}?`,
        message:
          "They will be removed from your contacts. This cannot be undone.",
        confirmLabel: "Delete contact",
        cancelLabel: "Cancel",
      });
      if (!ok) return;
      setDeletingId(c.id);
      setError(null);
      const res = await deleteContact(c.id);
      if (res.ok) {
        setContacts((prev) => prev.filter((x) => x.id !== c.id));
        router.refresh();
        toast.success({
          title: "Contact deleted",
          message: `${c.firstName} ${c.lastName} has been removed.`,
        });
      } else {
        toast.error({
          title: "Couldn't delete contact",
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
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: "var(--tight)",
            margin: 0,
          }}
        >
          Contacts
        </h1>
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

      {/* Birthdays this month */}
      <Card surface="shell" pad={20}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 140 }}>
            <div className="caps" style={{ color: "var(--ink-faint)" }}>
              Birthdays this month
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 36,
                marginTop: 8,
              }}
            >
              {birthdayRows.length} guest{birthdayRows.length === 1 ? "" : "s"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {birthdayRows.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  width: "fit-content",
                  paddingLeft: 4,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  background: "var(--shell)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-pill)",
                }}
              >
                <Avatar
                  name={`${c.firstName} ${c.lastName}`}
                  size={32}
                  tint="teal"
                />
                <span
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.firstName} {c.lastName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-soft)",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span aria-hidden>🎂</span>
                    {formatBirthday(c.birthday)}
                  </span>
                </span>
              </div>
            ))}
            {birthdayRows.length === 0 && (
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                No birthdays this month.
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            iconRight={<Icon name="ArrowRight" size={14} />}
          >
            Send birthday offers
          </Button>
        </div>
      </Card>

      {/* Filters + search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(FILTER_LABELS) as FilterId[]).map((id) => (
          <FilterPill
            key={id}
            on={activeFilter === id}
            count={counts[id]}
            onClick={() => setActiveFilter(id)}
          >
            {FILTER_LABELS[id]}
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
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TierFilter)}
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
            <option value="all">All tiers</option>
            {CONTACT_TIERS.map((t) => (
              <option key={t} value={t}>
                {CONTACT_TIER_LABELS[t]}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={15}
            style={{ position: "absolute", right: 14, pointerEvents: "none" }}
          />
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <select
            value={contactTypeFilter}
            onChange={(e) =>
              setContactTypeFilter(e.target.value as ContactTypeFilter)
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
            <option value="all">All contact types</option>
            {contactTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={15}
            style={{ position: "absolute", right: 14, pointerEvents: "none" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
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
            flex: "1 1 280px",
            maxWidth: 400,
          }}
        >
          <Icon name="Search" size={15} />
          <input
            placeholder="Search name, email or phone…"
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
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
            New contact
          </Button>
        </div>
      </div>

      <Card pad={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "14px 22px",
            borderBottom: "1px solid var(--line-soft)",
          }}
          className="caps"
        >
          <span style={{ color: "var(--ink-faint)" }}>Client #</span>
          <span style={{ color: "var(--ink-faint)" }}>Name</span>
          <span style={{ color: "var(--ink-faint)" }}>Email</span>
          <span style={{ color: "var(--ink-faint)" }}>Phone</span>
          <span style={{ color: "var(--ink-faint)" }}>Stays</span>
          <span style={{ color: "var(--ink-faint)" }}>Tier</span>
          <span style={{ color: "var(--ink-faint)" }}>Birthday</span>
          <span style={{ color: "var(--ink-faint)" }}>Last stay</span>
          <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>
            {/* Action */}
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
            No contacts match this filter.
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                alignItems: "center",
                padding: "14px 22px",
                borderTop: i > 0 ? "1px solid var(--line-soft)" : "none",
                fontSize: 13,
              }}
            >
              <span
                title={c.id}
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
                {c.id.slice(0, 8)}
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
                  name={`${c.firstName} ${c.lastName}`}
                  size={36}
                  tint={avatarTint(c.id)}
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
                    {c.firstName} {c.lastName}
                  </span>
                  {c.returningGuest && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        color: "var(--teal-ink)",
                      }}
                    >
                      Returning guest
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  color: "var(--ink-soft)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.email ?? "—"}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{c.phone ?? "—"}</span>
              <span>{c.stayCount}</span>
              <span>
                {c.tier ? (
                  <Pill
                    tone="neutral"
                    style={{
                      ...TIER_STYLE[c.tier],
                      border: "1px solid transparent",
                    }}
                  >
                    {CONTACT_TIER_LABELS[c.tier]}
                  </Pill>
                ) : (
                  <span style={{ color: "var(--ink-faint)" }}>—</span>
                )}
              </span>
              <span
                style={
                  birthdayIds.has(c.id)
                    ? {
                        fontWeight: 700,
                        fontStyle: "italic",
                        color: "var(--terra-deep)",
                      }
                    : { color: "var(--ink-soft)" }
                }
              >
                {formatBirthday(c.birthday) ?? "—"}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>
                {c.lastStayLabel ?? "—"}
              </span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <RowActionsMenu
                  onEdit={() => setEditContact(c)}
                  onDelete={() => handleDelete(c)}
                  canDelete={canDelete}
                  isDeleting={deletingId === c.id}
                />
              </div>
            </div>
          ))
        )}
      </Card>

      <NewContactModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        contactTypes={contactTypes}
        contactSources={contactSources}
        groups={groups}
        onSave={handleCreate}
      />
      <EditContactModal
        isOpen={editContact !== null}
        onClose={() => setEditContact(null)}
        contact={editContact}
        contactTypes={contactTypes}
        contactSources={contactSources}
        groups={groups}
        onSave={handleUpdate}
      />
    </div>
  );
}
