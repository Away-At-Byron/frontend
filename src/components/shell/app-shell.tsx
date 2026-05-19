"use client";

/**
 * Desktop app shell — sidebar nav + topbar + page slot.
 * Ported from the approved design bundle (desktop/shell.jsx), wired to
 * Next routing, the real session, and Auth.js sign-out.
 */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Avatar, Button, IconButton } from "@/components/ui/primitives";
import type { NavEntry } from "@/lib/modules";

const PROPERTIES = [
  { id: "all", name: "All properties", rooms: 9 },
  { id: "byron", name: "Away at Byron Bay", rooms: 3 },
  { id: "shirley", name: "Away on Shirley Lane", rooms: 3 },
  { id: "unwind", name: "Unwind Guesthouse", rooms: 3 },
];

export function AppShell({
  user,
  nav,
  children,
}: {
  user: { name: string; role: string };
  nav: NavEntry[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [property, setProperty] = useState(PROPERTIES[0]!);
  const [propOpen, setPropOpen] = useState(false);
  const today = nav.filter((n) => n.group === "today");
  const secondary = nav.filter((n) => n.group === "manage");
  const current =
    nav.find((n) => pathname === n.href || pathname.startsWith(n.href + "/")) ??
    nav[0];
  const title = current?.label ?? "";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--linen)",
        fontFamily: "var(--font-sans), sans-serif",
        color: "var(--ink)",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 260,
          flex: "0 0 260px",
          borderRight: "1px solid var(--line)",
          background: "var(--linen)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "24px 22px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--linen)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontSize: 17,
            }}
          >
            a
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 16,
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              Away <em style={{ fontStyle: "italic" }}>at Byron</em>
            </div>
            <div
              className="caps"
              style={{ marginTop: 3, fontSize: 9, color: "var(--ink-faint)" }}
            >
              Reservations · Admin
            </div>
          </div>
        </div>

        {/* Property switcher */}
        <div style={{ padding: "8px 14px 4px", position: "relative" }}>
          <button
            type="button"
            onClick={() => setPropOpen((v) => !v)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--shell)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--r-2)",
              padding: "10px 12px",
              cursor: "pointer",
              font: "inherit",
              color: "var(--ink)",
            }}
          >
            <Icon name="House" size={16} strokeWidth={1.6} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1,
                  fontStyle: "italic",
                }}
              >
                {property.name}
              </div>
              <div
                className="caps"
                style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 3 }}
              >
                {property.rooms} rooms
              </div>
            </div>
            <Icon name="ChevronDown" size={14} />
          </button>
          {propOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 14,
                right: 14,
                zIndex: 10,
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-2)",
                boxShadow: "var(--shadow-pop)",
                padding: 6,
              }}
            >
              {PROPERTIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProperty(p);
                    setPropOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: "var(--r-1)",
                    background:
                      property.id === p.id ? "var(--shell)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    font: "inherit",
                    color: "var(--ink)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontStyle: property.id === p.id ? "italic" : "normal",
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: "var(--ink-faint)" }}
                  >
                    {p.rooms}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            className="caps"
            style={{ padding: "8px 12px 4px", color: "var(--ink-faint)" }}
          >
            Today
          </div>
          {today.map((n) => (
            <NavItem key={n.href} item={n} active={current?.href === n.href} />
          ))}
          <div
            className="caps"
            style={{ padding: "18px 12px 4px", color: "var(--ink-faint)" }}
          >
            Manage
          </div>
          {secondary.map((n) => (
            <NavItem key={n.href} item={n} active={current?.href === n.href} />
          ))}
        </nav>

        {/* User footer */}
        <div
          style={{
            marginTop: "auto",
            padding: "14px 14px 18px",
            borderTop: "1px solid var(--line-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={user.name} size={36} tint="teal" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.1,
                }}
              >
                {user.name}
              </div>
              <div
                className="caps"
                style={{
                  fontSize: 9,
                  color: "var(--ink-faint)",
                  marginTop: 2,
                  textTransform: "capitalize",
                }}
              >
                {user.role.replace(/_/g, " ")}
              </div>
            </div>
            <IconButton
              size={30}
              variant="quiet"
              title="Sign out"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <Icon name="Logout" size={15} />
            </IconButton>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 32px",
            borderBottom: "1px solid var(--line)",
            background: "var(--linen)",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="caps"
              style={{ color: "var(--ink-faint)", fontSize: 10 }}
              suppressHydrationWarning
            >
              {todayLabel()} · {property.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 28,
                lineHeight: 1.05,
                letterSpacing: "var(--tight)",
                marginTop: 4,
              }}
              suppressHydrationWarning
            >
              {current?.href === "/home" ? (
                <>
                  Good{" "}
                  <em style={{ fontStyle: "italic" }} suppressHydrationWarning>
                    {partOfDay()}
                  </em>
                  , {user.name.split(" ")[0]}
                </>
              ) : (
                title
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-pill)",
              padding: "10px 16px",
              width: 320,
            }}
          >
            <Icon name="Search" size={15} />
            <input
              placeholder="Search guests, rooms, #5453…"
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
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
                padding: "2px 6px",
                background: "var(--shell)",
                borderRadius: 4,
              }}
            >
              ⌘K
            </span>
          </div>
          <IconButton variant="paper" size={42} title="Notifications">
            <Icon name="Bell" size={17} />
          </IconButton>
          <Link href="/bookings/new">
            <Button
              variant="primary"
              size="md"
              icon={<Icon name="Plus" size={15} />}
            >
              New booking
            </Button>
          </Link>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </main>
    </div>
  );
}

function NavItem({ item, active }: { item: NavEntry; active: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px",
        borderRadius: "var(--r-2)",
        textDecoration: "none",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--linen)" : "var(--ink)",
      }}
    >
      <Icon name={item.icon} size={17} strokeWidth={1.6} />
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 500 }}>
        {item.label}
      </span>
      {item.badge && (
        <span
          style={{
            background: active ? "var(--linen)" : "var(--terra)",
            color: active ? "var(--ink)" : "var(--linen)",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "var(--r-pill)",
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    weekday: "long",
  });
}
function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
