"use client";

/**
 * Guest History tab — top-row stats + Bookings table (mocked until the
 * Booking module lands, FRS §6.5).
 */
import { useState, type ReactNode } from "react";
import { Card, Pill, Stat } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";

type BookingStatus = "pending" | "departed" | "active";

type BookingRow = {
  ref: string;
  dates: string;
  propertyRoom: string;
  nights: number;
  total: number;
  source: string;
  status: BookingStatus;
  accent: "teal" | "terra" | "ink";
};

// Mock bookings — the Booking module hasn't landed yet (FRS §6.5). Replace
// with real data once it does.
const MOCK_BOOKINGS: BookingRow[] = [
  {
    ref: "R-5453",
    dates: "22-25 Nov 2026",
    propertyRoom: "Away 03",
    nights: 3,
    total: 840,
    source: "Booking.com",
    status: "pending",
    accent: "teal",
  },
  {
    ref: "R-5311",
    dates: "10-14 Jun 2025",
    propertyRoom: "Sunrise 03",
    nights: 4,
    total: 720,
    source: "Direct",
    status: "departed",
    accent: "terra",
  },
  {
    ref: "R-5102",
    dates: "02-05 Apr 2024",
    propertyRoom: "BGH 02",
    nights: 3,
    total: 610,
    source: "Direct",
    status: "departed",
    accent: "ink",
  },
];

type BookingFilter = "all" | "past" | "active";

// Shared by the header and body rows so columns line up at any card width.
const BOOKING_COLUMNS =
  "80px 140px minmax(160px, 1.6fr) 56px 96px minmax(120px, 1fr) 120px 20px";

function aud(n: number): string {
  return `A$${n.toLocaleString("en-AU")}`;
}

export function GuestHistoryTab() {
  const [filter, setFilter] = useState<BookingFilter>("all");

  const totalStays = MOCK_BOOKINGS.length;
  const totalNights = MOCK_BOOKINGS.reduce((s, b) => s + b.nights, 0);
  const avgStay = totalStays ? totalNights / totalStays : 0;
  const lifetime = MOCK_BOOKINGS.reduce((s, b) => s + b.total, 0);
  const avgValue = totalStays ? Math.round(lifetime / totalStays) : 0;

  const counts = {
    all: MOCK_BOOKINGS.length,
    past: MOCK_BOOKINGS.filter((b) => b.status === "departed").length,
    active: MOCK_BOOKINGS.filter(
      (b) => b.status === "pending" || b.status === "active",
    ).length,
  };

  const filtered = MOCK_BOOKINGS.filter((b) => {
    if (filter === "all") return true;
    if (filter === "past") return b.status === "departed";
    return b.status === "pending" || b.status === "active";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <Stat icon="Bed" label="Total stays" value={totalStays} />
        <Stat
          icon="Calendar"
          label="Avg stay length"
          value={`${avgStay.toFixed(1)} nts`}
        />
        <Stat icon="Dollar" label="Lifetime revenue" value={aud(lifetime)} />
        <Stat
          icon="Sparkline"
          label="Avg booking value"
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
            <BookingFilterPill
              on={filter === "all"}
              count={counts.all}
              onClick={() => setFilter("all")}
            >
              All
            </BookingFilterPill>
            <BookingFilterPill
              on={filter === "past"}
              count={counts.past}
              onClick={() => setFilter("past")}
            >
              Past
            </BookingFilterPill>
            <BookingFilterPill
              on={filter === "active"}
              count={counts.active}
              onClick={() => setFilter("active")}
            >
              Active & upcoming
            </BookingFilterPill>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: BOOKING_COLUMNS,
            gap: 16,
            padding: "10px 22px",
            borderTop: "1px solid var(--line-soft)",
            borderBottom: "1px solid var(--line-soft)",
            alignItems: "center",
          }}
          className="caps"
        >
          <span style={{ color: "var(--ink-faint)" }}>Ref</span>
          <span style={{ color: "var(--ink-faint)" }}>Dates</span>
          <span style={{ color: "var(--ink-faint)" }}>Property · Room</span>
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

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 22px",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: 13.5,
            }}
          >
            No bookings match this filter.
          </div>
        ) : (
          filtered.map((b, i) => (
            <BookingRowItem key={b.ref} row={b} isFirst={i === 0} />
          ))
        )}
      </Card>
    </div>
  );
}

function BookingRowItem({
  row,
  isFirst,
}: {
  row: BookingRow;
  isFirst: boolean;
}) {
  const accentColor: Record<BookingRow["accent"], string> = {
    teal: "var(--teal-ink)",
    terra: "var(--terra-deep)",
    ink: "var(--ink)",
  };
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: BOOKING_COLUMNS,
        gap: 16,
        alignItems: "center",
        padding: "14px 22px",
        borderTop: isFirst ? "none" : "1px solid var(--line-soft)",
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
          background: accentColor[row.accent],
        }}
      />
      <span
        className="mono"
        style={{ color: "var(--ink-faint)", fontSize: 12 }}
      >
        {row.ref}
      </span>
      <span style={{ color: "var(--ink)" }}>{row.dates}</span>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontSize: 15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.propertyRoom}
      </span>
      <span
        className="mono"
        style={{ textAlign: "right", color: "var(--ink-soft)" }}
      >
        {row.nights}
      </span>
      <span
        className="mono"
        style={{ textAlign: "right", color: "var(--ink)" }}
      >
        {aud(row.total)}
      </span>
      <span
        style={{
          color: "var(--ink-soft)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {row.source}
      </span>
      <span>
        <BookingStatusPill status={row.status} />
      </span>
      <Icon
        name="ChevronDown"
        size={14}
        style={{
          transform: "rotate(-90deg)",
          color: "var(--ink-faint)",
          justifySelf: "end",
        }}
      />
    </div>
  );
}

function BookingStatusPill({ status }: { status: BookingStatus }) {
  if (status === "pending") {
    return (
      <Pill
        tone="neutral"
        size="sm"
        style={{
          background: "var(--apricot, var(--warn-bg))",
          color: "var(--ink)",
          border: "1px solid transparent",
        }}
      >
        Pending
      </Pill>
    );
  }
  if (status === "active") {
    return (
      <Pill tone="ok" size="sm">
        Active
      </Pill>
    );
  }
  return (
    <Pill tone="paper" size="sm">
      Departed
    </Pill>
  );
}

function BookingFilterPill({
  children,
  on,
  count,
  onClick,
}: {
  children: ReactNode;
  on?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: "var(--r-pill)",
        cursor: "pointer",
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--linen)" : "var(--ink)",
        border: on ? "none" : "1px solid var(--line-strong)",
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "var(--tracked)",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {count != null && (
        <span style={{ opacity: on ? 0.7 : 0.5 }}>· {count}</span>
      )}
    </button>
  );
}

