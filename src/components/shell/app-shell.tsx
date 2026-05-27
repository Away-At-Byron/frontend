"use client";

/**
 * Desktop app shell — sidebar nav + topbar + page slot.
 * Ported from the approved design bundle (desktop/shell.jsx), wired to
 * Next routing, the real session, and Auth.js sign-out.
 */
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Avatar, Button, IconButton } from "@/components/ui/primitives";
import type { NavEntry } from "@/lib/modules";
import navbarBg from "./assets/navbar-bg.png";
import navbarBgBottom from "./assets/navbar-bg-bottom.png";
import logoTemp from "./assets/logo-temp.png";

const PROPERTIES = [
  { id: "all", name: "All properties", rooms: 9 },
  { id: "byron", name: "Away at Byron Bay", rooms: 3 },
  { id: "shirley", name: "Away on Shirley Lane", rooms: 3 },
  { id: "unwind", name: "Unwind Guesthouse", rooms: 3 },
];

// Routes not scoped to a single property (e.g. Users spans every property).
// The topbar shows just the date on these - add an href here to hide the
// property name on another page.
const HIDE_PROPERTY_ROUTES = [
  "/users",
  "/contacts",
  "/contacts/guest-history",
  "/contacts/groups",
  "/settings/contact-types",
  "/settings/contact-sources",
  "/settings/room-types",
  "/settings/room-configurations",
  "/settings/property-amenities",
  "/settings/room-amenities",
  "/settings/discount-types",
  "/settings/room-requests",
];

// Routes whose page renders its own <h1>, so the topbar title would just
// duplicate it - hide the topbar title (date and controls stay) on these.
const HIDE_TITLE_ROUTES = [
  "/users",
  "/contacts",
  "/contacts/guest-history",
  "/contacts/groups",
  "/settings/contact-types",
  "/settings/contact-sources",
  "/settings/room-types",
  "/settings/room-configurations",
  "/settings/property-amenities",
  "/settings/room-amenities",
  "/settings/discount-types",
  "/settings/room-requests",
];

const PORTAL_LABELS: Record<string, string> = {
  admin: "Admin Portal",
  manager: "Manager Portal",
  staff: "Staff Portal",
  housekeeper: "Housekeeper Portal",
  contractor: "Contractor Portal",
  other: "Other Portal",
};

function portalLabel(role: string) {
  return (
    PORTAL_LABELS[role.toLowerCase()] ?? `${role.replace(/_/g, " ")} Portal`
  );
}

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
  const property = PROPERTIES[0]!;
  const today = nav.filter((n) => n.group === "today");
  const secondary = nav.filter((n) => n.group === "manage");
  // Flatten one level deep so a submenu child can be the current route.
  const flatNav = nav.flatMap((n) => (n.children ? [n, ...n.children] : [n]));
  // Prefer an exact match so /contacts/groups picks the Groups child rather
  // than the /contacts parent (whose prefix would otherwise win).
  const current =
    flatNav.find((n) => n.href && pathname === n.href) ??
    flatNav.find((n) => n.href && pathname.startsWith(n.href + "/")) ??
    nav[0];
  const title = current?.label ?? "";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--cloud)",
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
          backgroundImage: `url(${navbarBg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundColor: "var(--teal)",
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
          <Image
            src={logoTemp}
            alt="Away at Byron"
            width={48}
            height={48}
            style={{ width: 48, height: 48, objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontSize: 16,
                lineHeight: 1,
                fontWeight: 400,
                color: "var(--ink)",
              }}
            >
              Away <em style={{ fontStyle: "italic" }}>at Byron</em>
            </div>
            <div
              className="caps"
              style={{
                marginTop: 3,
                fontSize: 9,
                color: "var(--ink-soft)",
              }}
            >
              {portalLabel(user.role)}
            </div>
          </div>
        </div>

        {/* Property switcher */}
        {/* <div style={{ padding: "8px 14px 4px", position: "relative" }}>
          <button
            type="button"
            onClick={() => setPropOpen((v) => !v)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(251,248,243,0.45)",
              border: "1px solid rgba(31,42,42,0.12)",
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
                style={{
                  fontSize: 9,
                  color: "var(--ink-soft)",
                  marginTop: 3,
                }}
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
        </div> */}

        {/* Nav */}
        <nav
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {today.map((n) => (
            <NavNode
              key={n.href ?? n.label}
              item={n}
              currentHref={current?.href}
            />
          ))}
          {secondary.map((n) => (
            <NavNode
              key={n.href ?? n.label}
              item={n}
              currentHref={current?.href}
            />
          ))}
        </nav>

        {/* User footer — wave transition from teal to linen */}
        <div
          style={{
            marginTop: "auto",
            position: "relative",
            paddingTop: 20,
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${navbarBgBottom.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "12px 14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Avatar name={user.name} size={36} tint="terra" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: "var(--ink)",
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
            borderBottom: "1px solid #FAEFE7",
            background: "var(--cloud)",
            // linear-gradient(180deg, #E4CFC1C7 0%, transparent 100%) over a
            // 24px fade, sampled as 6 hard-edged box-shadow bands.
            // (#E4CFC1C7 = rgb(228,207,193) at 0.78 alpha.)
            // boxShadow: [
            //   "0 4px 0 0 rgba(228,207,193,0.314)",
            //   "0 8px 0 0 rgba(228,207,193,0.239)",
            //   "0 12px 0 0 rgba(228,207,193,0.193)",
            //   "0 16px 0 0 rgba(228,207,193,0.162)",
            //   "0 20px 0 0 rgba(228,207,193,0.139)",
            //   "0 24px 0 0 rgba(228,207,193,0.065)",
            // ].join(", "),
            // Previous #FAEFE7 version:
            boxShadow: [
              "0 4px 0 0 rgba(250,239,231,0.667)",
              "0 8px 0 0 rgba(250,239,231,0.4)",
              "0 12px 0 0 rgba(250,239,231,0.286)",
              "0 16px 0 0 rgba(250,239,231,0.222)",
              "0 20px 0 0 rgba(250,239,231,0.182)",
              "0 24px 0 0 rgba(250,239,231,0.083)",
            ].join(", "),
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
              {todayLabel()}
              {!HIDE_PROPERTY_ROUTES.includes(current?.href ?? "") &&
                ` · ${property.name}`}
            </div>
            {!HIDE_TITLE_ROUTES.includes(current?.href ?? "") && (
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
                    <em
                      style={{ fontStyle: "italic" }}
                      suppressHydrationWarning
                    >
                      {partOfDay()}
                    </em>
                    , {user.name.split(" ")[0]}
                  </>
                ) : (
                  title
                )}
              </div>
            )}
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

/** Renders a leaf link, or an expandable parent when the entry has children. */
function NavNode({
  item,
  currentHref,
}: {
  item: NavEntry;
  currentHref?: string;
}) {
  if (item.children && item.children.length > 0) {
    return <NavParent item={item} currentHref={currentHref} />;
  }
  return <NavItem item={item} active={currentHref === item.href} />;
}

/** A parent entry that expands a submenu. Stays open while a child is active. */
function NavParent({
  item,
  currentHref,
}: {
  item: NavEntry;
  currentHref?: string;
}) {
  const children = item.children ?? [];
  const containsCurrent = children.some((c) => c.href === currentHref);
  const [open, setOpen] = useState(false);
  const expanded = open || containsCurrent;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "9px 12px",
          borderRadius: "var(--r-2)",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          font: "inherit",
          color: "var(--ink)",
          background:
            containsCurrent && !expanded ? "var(--shell)" : "transparent",
        }}
      >
        <Icon name={item.icon} size={17} strokeWidth={1.6} />
        <span
          style={{
            flex: 1,
            fontSize: 13.5,
            fontWeight: containsCurrent ? 600 : 500,
          }}
        >
          {item.label}
        </span>
        <Icon
          name="ChevronDown"
          size={14}
          style={{
            transition: "transform .15s",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        />
      </button>
      {expanded &&
        children.map((c) => (
          <NavItem
            key={c.href ?? c.label}
            item={c}
            active={currentHref === c.href}
            nested
          />
        ))}
    </>
  );
}

function NavItem({
  item,
  active,
  nested = false,
}: {
  item: NavEntry;
  active: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={item.href ?? "#"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: nested ? "8px 12px 8px 22px" : "9px 12px",
        borderRadius: "var(--r-2)",
        textDecoration: "none",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--linen)" : "var(--ink)",
      }}
    >
      {nested ? (
        <span
          style={{
            width: 17,
            flex: "0 0 auto",
            display: "inline-flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: active ? "var(--linen)" : "var(--line-strong)",
            }}
          />
        </span>
      ) : (
        <Icon name={item.icon} size={17} strokeWidth={1.6} />
      )}
      <span
        style={{
          flex: 1,
          fontSize: nested ? 13 : 13.5,
          fontWeight: active ? 600 : 500,
        }}
      >
        {item.label}
      </span>
      {item.badge && (
        <span
          style={{
            background: "var(--terra)",
            color: "var(--linen)",
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
