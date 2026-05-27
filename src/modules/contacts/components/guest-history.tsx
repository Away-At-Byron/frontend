"use client";

/**
 * Guest History page — pick a guest from the left rail (real Contacts),
 * see their booking history on the right. Booking rows + totals + timeline
 * are mocked until the Booking module (FRS §6.5) lands.
 * Design ref: docs/design-reference/guest-history.jsx.
 */
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, Button, Card, FilterPill, Pill, Stat } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import type { ContactRow } from "../types";

type BookingStatus = "inhouse" | "confirmed" | "pending" | "departed";
type AvatarTint = "teal" | "shell" | "sand" | "ink" | "apri" | "mist" | "terra" | "rattan";
type PropertyKey = "away" | "sunrise" | "bgh" | "aireys";

type Stay = {
  ref: string;
  when: string;
  prop: PropertyKey;
  room: string;
  nights: number;
  rate: number;
  source: string;
  status: BookingStatus;
};

const PROP_COLOR: Record<PropertyKey, string> = {
  away: "var(--teal-ink)",
  sunrise: "var(--terra-deep)",
  bgh: "var(--ink)",
  aireys: "var(--apricot)",
};

const PROP_LABEL: Record<PropertyKey, string> = {
  away: "Away",
  sunrise: "Sunrise",
  bgh: "BGH",
  aireys: "Aireys",
};

const STATUS_PILL: Record<BookingStatus, { tone: "teal" | "ok" | "warn" | "paper"; label: string }> = {
  inhouse: { tone: "teal", label: "In house" },
  confirmed: { tone: "ok", label: "Confirmed" },
  pending: { tone: "warn", label: "Pending" },
  departed: { tone: "paper", label: "Departed" },
};

const TINT_CYCLE: AvatarTint[] = [
  "teal",
  "shell",
  "apri",
  "sand",
  "mist",
  "terra",
  "rattan",
];

// Mock bookings — Booking module (FRS §6.5) hasn't landed. Same stays show
// for every guest so the right-hand panels demonstrate the layout.
const MOCK_STAYS: Stay[] = [
  { ref: "R-5453", when: "22-25 Nov 2026", prop: "away", room: "Away 03", nights: 3, rate: 840, source: "Booking.com", status: "pending" },
  { ref: "R-5311", when: "10-14 Jun 2025", prop: "sunrise", room: "Sunrise 03", nights: 4, rate: 720, source: "Direct", status: "departed" },
  { ref: "R-5102", when: "02-05 Apr 2024", prop: "bgh", room: "BGH 02", nights: 3, rate: 610, source: "Direct", status: "departed" },
];

type BookingFilter = "all" | "past" | "active";

function aud(n: number): string {
  return `A$${n.toLocaleString("en-AU")}`;
}

function tintFor(id: string): AvatarTint {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TINT_CYCLE[h % TINT_CYCLE.length]!;
}

function shortId(id: string): string {
  return `G-${id.slice(0, 4).toUpperCase()}`;
}

function sinceFromContact(c: ContactRow): string {
  const raw = c.firstBookingDate;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function GuestHistory({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("all");

  // URL is the source of truth for the selected guest — clicking a row in
  // the Contacts table pushes ?guest=<id> here, and clicking the rail below
  // replaces the same param.
  const requestedGuest = searchParams.get("guest");
  const selectedId =
    (requestedGuest && contacts.some((c) => c.id === requestedGuest)
      ? requestedGuest
      : contacts[0]?.id) ?? "";
  const selectGuest = (id: string) => {
    router.replace(`${pathname}?guest=${id}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const guest = contacts.find((c) => c.id === selectedId) ?? contacts[0];

  if (!guest) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        No contacts yet. Add a contact first.
      </div>
    );
  }

  const tint = tintFor(guest.id);
  const since = sinceFromContact(guest);
  const stayCount = MOCK_STAYS.length;
  const totalNights = MOCK_STAYS.reduce((s, x) => s + x.nights, 0);
  const lifetime = MOCK_STAYS.reduce((s, x) => s + x.rate, 0);
  const avgValue = stayCount ? Math.round(lifetime / stayCount) : 0;

  const counts = {
    all: MOCK_STAYS.length,
    past: MOCK_STAYS.filter((s) => s.status === "departed").length,
    active: MOCK_STAYS.filter((s) => s.status !== "departed").length,
  };
  const visibleStays = MOCK_STAYS.filter((s) => {
    if (filter === "all") return true;
    if (filter === "past") return s.status === "departed";
    return s.status !== "departed";
  });

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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 300,
              fontSize: 32,
              letterSpacing: "var(--tight)",
              margin: 0,
            }}
          >
            Guest <em style={{ fontStyle: "italic" }}>history</em>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="paper" icon={<Icon name="Calendar" size={14} />}>
            Export PDF
          </Button>
          <Button
            variant="primary"
            icon={<Icon name="Plus" size={14} />}
            onClick={() => router.push("/bookings")}
          >
            New booking
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* ── Guests rail ── */}
        <Card pad={0}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 18,
                fontWeight: 400,
                letterSpacing: "var(--tight)",
              }}
            >
              Guests
            </div>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-faint)" }}
            >
              {filtered.length}
            </span>
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--line-soft)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--linen)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-pill)",
                padding: "7px 12px",
              }}
            >
              <Icon name="Search" size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guests…"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  font: "inherit",
                  fontSize: 12,
                  color: "var(--ink)",
                }}
              />
            </div>
          </div>
          <div
            className="no-scrollbar"
            style={{ maxHeight: 560, overflow: "auto" }}
          >
            {filtered.map((c) => {
              const on = c.id === guest.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectGuest(c.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "12px 16px",
                    cursor: "pointer",
                    font: "inherit",
                    color: "var(--ink)",
                    background: on ? "var(--linen)" : "transparent",
                    border: "none",
                    borderTop: "1px solid var(--line-soft)",
                    borderLeft: on
                      ? "3px solid var(--ink)"
                      : "3px solid transparent",
                  }}
                >
                  <Avatar
                    name={`${c.firstName} ${c.lastName}`}
                    size={36}
                    tint={tintFor(c.id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display), serif",
                          fontSize: 14,
                          fontWeight: on ? 500 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.firstName} {c.lastName}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ink-faint)" }}
                      >
                        {c.stayCount}×
                      </span>
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        color: "var(--ink-faint)",
                        marginTop: 2,
                      }}
                    >
                      {shortId(c.id)} · since {sinceFromContact(c)}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--ink-soft)",
                  fontSize: 13,
                  borderTop: "1px solid var(--line-soft)",
                }}
              >
                No guests match that search.
              </div>
            )}
          </div>
        </Card>

        {/* ── Detail column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={0}>
            <div
              style={{
                padding: "22px 24px",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 18,
                alignItems: "center",
              }}
            >
              <Avatar
                name={`${guest.firstName} ${guest.lastName}`}
                size={72}
                tint={tint}
              />
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    letterSpacing: "var(--tracked)",
                  }}
                >
                  {shortId(guest.id)} · since {since}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontWeight: 300,
                    fontSize: 30,
                    lineHeight: 1.05,
                    letterSpacing: "var(--tight)",
                    marginTop: 5,
                  }}
                >
                  {guest.firstName}{" "}
                  <em style={{ fontStyle: "italic" }}>{guest.lastName}</em>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Pill tone="ok" size="sm">
                    {stayCount} stays
                  </Pill>
                  <Pill tone="info" size="sm">
                    {aud(lifetime)} lifetime
                  </Pill>
                  {guest.returningGuest && (
                    <Pill tone="warn" size="sm">
                      Returning guest
                    </Pill>
                  )}
                  {guest.tier && (
                    <Pill tone="paper" size="sm">
                      {guest.tier.toUpperCase()}
                    </Pill>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="paper"
                  icon={<Icon name="Edit" size={14} />}
                  onClick={() => router.push(`/contacts/${guest.id}`)}
                >
                  Open contact
                </Button>
                <Button
                  variant="primary"
                  icon={<Icon name="Plus" size={14} />}
                  onClick={() => router.push("/bookings")}
                >
                  New booking
                </Button>
              </div>
            </div>
            {(guest.notes || guest.specialRequests) && (
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid var(--line-soft)",
                  background: "var(--linen)",
                }}
              >
                <div
                  className="caps"
                  style={{ color: "var(--ink-faint)", marginBottom: 6 }}
                >
                  Stay preferences & notes
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "var(--ink-soft)",
                  }}
                >
                  {[guest.specialRequests, guest.notes]
                    .filter(Boolean)
                    .join(" — ")}
                </div>
              </div>
            )}
          </Card>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            <Stat icon="Bed" label="Total stays" value={stayCount} />
            <Stat icon="Calendar" label="Total nights" value={totalNights} />
            <Stat
              icon="Dollar"
              label="Lifetime spend"
              value={aud(lifetime)}
              tone="ok"
            />
            <Stat
              icon="TrendUp"
              label="Avg per stay"
              value={aud(avgValue)}
            />
          </div>

          <Card pad={0}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 400,
                  fontSize: 20,
                  letterSpacing: "var(--tight)",
                }}
              >
                Bookings
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <FilterPill
                  on={filter === "all"}
                  count={counts.all}
                  onClick={() => setFilter("all")}
                >
                  All
                </FilterPill>
                <FilterPill
                  on={filter === "past"}
                  count={counts.past}
                  onClick={() => setFilter("past")}
                >
                  Past
                </FilterPill>
                <FilterPill
                  on={filter === "active"}
                  count={counts.active}
                  onClick={() => setFilter("active")}
                >
                  Active & upcoming
                </FilterPill>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "90px 1.4fr 1.2fr 50px 90px 110px 110px 24px",
                gap: 10,
                padding: "10px 22px",
                borderTop: "1px solid var(--line-soft)",
                borderBottom: "1px solid var(--line-soft)",
              }}
              className="caps"
            >
              <span style={{ color: "var(--ink-faint)" }}>Ref</span>
              <span style={{ color: "var(--ink-faint)" }}>Dates</span>
              <span style={{ color: "var(--ink-faint)" }}>
                Property · Room
              </span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>
                Nts
              </span>
              <span style={{ color: "var(--ink-faint)", textAlign: "right" }}>
                Total
              </span>
              <span style={{ color: "var(--ink-faint)" }}>Source</span>
              <span style={{ color: "var(--ink-faint)" }}>Status</span>
              <span />
            </div>

            {visibleStays.length === 0 ? (
              <div
                style={{
                  padding: "40px 22px",
                  textAlign: "center",
                  color: "var(--ink-faint)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontSize: 18,
                  }}
                >
                  No bookings match this filter.
                </div>
              </div>
            ) : (
              visibleStays.map((s) => (
                <div
                  key={s.ref}
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns:
                      "90px 1.4fr 1.2fr 50px 90px 110px 110px 24px",
                    gap: 10,
                    padding: "14px 22px",
                    alignItems: "center",
                    borderTop: "1px solid var(--line-soft)",
                    fontSize: 13.5,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 3,
                      background: PROP_COLOR[s.prop],
                    }}
                  />
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: "var(--ink-faint)" }}
                  >
                    {s.ref}
                  </span>
                  <span>{s.when}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontStyle: "italic",
                      fontSize: 14,
                    }}
                  >
                    {s.room}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 12, textAlign: "right" }}
                  >
                    {s.nights}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontSize: 14,
                      textAlign: "right",
                    }}
                  >
                    {aud(s.rate)}
                  </span>
                  <span style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>
                    {s.source}
                  </span>
                  <Pill tone={STATUS_PILL[s.status].tone} size="sm">
                    {STATUS_PILL[s.status].label}
                  </Pill>
                  <Icon
                    name="ChevronDown"
                    size={14}
                    style={{
                      transform: "rotate(-90deg)",
                      color: "var(--ink-faint)",
                    }}
                  />
                </div>
              ))
            )}
          </Card>

          <Card pad={0}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 400,
                  fontSize: 20,
                  letterSpacing: "var(--tight)",
                }}
              >
                Stay timeline
              </div>
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--ink-faint)" }}
              >
                Since {since}
              </span>
            </div>
            <div
              style={{
                padding: "18px 24px 28px",
                borderTop: "1px solid var(--line-soft)",
              }}
            >
              <GuestTimeline stays={MOCK_STAYS} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GuestTimeline({ stays }: { stays: Stay[] }) {
  const items = stays.slice().reverse();
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = items.map((s) => {
    const m = s.when.match(/(\d{4})/);
    return m && m[1] ? parseInt(m[1], 10) : 2024;
  });
  const minYear = Math.min(2024, ...years);
  const maxYear = Math.max(2026, ...years);
  const totalMonths = (maxYear - minYear + 1) * 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        className="mono"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 240px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, color: "var(--ink-faint)", width: 48 }}>
            {minYear}
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              width: 48,
              textAlign: "right",
            }}
          >
            {maxYear}
          </span>
        </div>
        <span
          className="caps"
          style={{ color: "var(--ink-faint)" }}
        >
          Stay
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((s) => {
          const yMatch = s.when.match(/(\d{4})/);
          const year =
            yMatch && yMatch[1] ? parseInt(yMatch[1], 10) : minYear;
          const monthMatch = s.when.match(
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/,
          );
          const monthIdx = monthMatch
            ? MONTHS.indexOf(monthMatch[1] as string)
            : 0;
          const x = Math.min(
            98,
            Math.max(2, (((year - minYear) * 12 + monthIdx) / totalMonths) * 100),
          );
          return (
            <div
              key={s.ref}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 240px",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "var(--line-soft)",
                  }}
                />
                <div
                  title={`${s.when} · ${s.room}`}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    transform: "translateX(-50%)",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: PROP_COLOR[s.prop],
                    border: "2px solid var(--paper)",
                    boxShadow: "0 1px 0 rgba(31,42,42,.08)",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-soft)",
                  fontFamily: "var(--font-display), serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.when} · {PROP_LABEL[s.prop]} {s.room.replace(/^\w+\s/, "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
