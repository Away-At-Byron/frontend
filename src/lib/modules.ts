/**
 * Module catalogue + navigation map + STATIC role defaults.
 *
 * Access model (ADR-003):
 *  - `ROLE_DEFAULTS` is a static, code-owned map: the modules a role can
 *    reach by default. Edit it here — it is not user-editable at runtime.
 *  - An admin may, per individual user, switch OFF some of that user's
 *    role-default modules (stored in `user_module_access`). A user can
 *    never gain a module outside their role default.
 *  - `admin` is always full. `dashboard` is always on (redirect target).
 *    `users` is admin-only and never appears as a per-user toggle.
 *
 * Pure data — safe to import from client and server.
 */
import type { IconName } from "@/components/ui/icon";

export type ModuleCode =
  | "dashboard"
  | "calendar"
  | "bookings"
  | "contacts"
  | "messages"
  | "housekeeping"
  | "maintenance"
  | "payments"
  | "invoices"
  | "reports"
  | "setup"
  | "users"
  | "settings";

export type ModuleDef = {
  code: ModuleCode;
  label: string;
  /** Always granted to everyone; never a toggle. */
  alwaysOn?: boolean;
  /** Only ever available to the admin role; never a per-user toggle. */
  adminOnly?: boolean;
};

export const MODULES: ModuleDef[] = [
  { code: "dashboard", label: "Dashboard", alwaysOn: true },
  { code: "calendar", label: "Calendar" },
  { code: "bookings", label: "Reservations" },
  { code: "contacts", label: "Contacts" },
  { code: "messages", label: "Messages" },
  { code: "housekeeping", label: "Housekeeping" },
  { code: "maintenance", label: "Maintenance" },
  { code: "payments", label: "Payments & Charges" },
  { code: "invoices", label: "Invoices" },
  { code: "reports", label: "Reports" },
  { code: "setup", label: "Setup" },
  { code: "users", label: "Users", adminOnly: true },
  { code: "settings", label: "Settings", adminOnly: true },
];

const BY_CODE = new Map(MODULES.map((m) => [m.code, m]));
const ALL_CODES = MODULES.map((m) => m.code);
const ALWAYS_ON = MODULES.filter((m) => m.alwaysOn).map((m) => m.code);

export function moduleLabel(code: string): string {
  return BY_CODE.get(code as ModuleCode)?.label ?? code;
}

/**
 * STATIC role → default modules. Set these values here; this is the
 * authoritative default. `admin` is full and represented as `[]` (resolved
 * as everything). `dashboard` is always-on so it is omitted.
 *
 * NOTE: "Timesheet" isn't a module/route in this system yet, so the
 * Housekeeper default uses `housekeeping` only. Add a timesheet module +
 * route first if you want it toggle-able.
 */
export const ROLE_DEFAULTS: Record<string, ModuleCode[]> = {
  manager: ["bookings", "contacts", "messages", "reports", "housekeeping"],
  staff: ["bookings", "messages", "contacts"],
  housekeeper: ["housekeeping"],
  contractor: ["maintenance"],
  other: ["bookings", "messages", "contacts"],
};

/**
 * Sentinel row written when an admin turns OFF every module for a user, so
 * "explicitly nothing" is distinguishable from "no override" (no rows).
 * It matches no real module, so it resolves to only the always-on set.
 */
export const OVERRIDE_NONE = "__none__";

/** Role names this system ships with, in display order. */
export const ROLE_NAMES = [
  "admin",
  "manager",
  "staff",
  "housekeeper",
  "contractor",
  "other",
] as const;

export type NavEntry = {
  /** Omitted for a parent entry that only expands a submenu. */
  href?: string;
  label: string;
  icon: IconName;
  group: "today" | "manage";
  module: ModuleCode;
  badge?: number;
  /** Visible to the admin role only, bypassing module access. */
  adminOnly?: boolean;
  /** Child entries rendered as an expandable submenu under this one. */
  children?: NavEntry[];
};

export const NAV_ENTRIES: NavEntry[] = [
  {
    href: "/home",
    label: "Home page",
    icon: "House",
    group: "today",
    module: "dashboard",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: "Message",
    group: "today",
    module: "messages",
    badge: 3,
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: "Calendar",
    group: "today",
    module: "bookings",
  },
  {
    label: "Contacts",
    icon: "User",
    group: "today",
    module: "contacts",
    children: [
      {
        href: "/contacts",
        label: "Contacts",
        icon: "User",
        group: "today",
        module: "contacts",
      },
      {
        href: "/contacts/groups",
        label: "Groups",
        icon: "User",
        group: "today",
        module: "contacts",
      },
      {
        href: "/contacts/guest-history",
        label: "Guest history",
        icon: "User",
        group: "today",
        module: "contacts",
      },
    ],
  },
  {
    href: "/users",
    label: "Users",
    icon: "User",
    group: "today",
    module: "users",
    adminOnly: true,
  },
  {
    href: "/property",
    label: "Property",
    icon: "Pin",
    group: "manage",
    module: "setup",
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    icon: "Sparkles",
    group: "manage",
    module: "housekeeping",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: "Settings",
    group: "manage",
    module: "maintenance",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "Sparkline",
    group: "manage",
    module: "reports",
  },
  {
    href: "/timesheets",
    label: "Timesheets",
    icon: "Clock",
    group: "manage",
    module: "housekeeping",
  },
  {
    label: "Settings",
    icon: "Settings",
    group: "manage",
    module: "settings",
    adminOnly: true,
    children: [
      {
        href: "/settings/contact-types",
        label: "Contact Types",
        icon: "User",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/contact-sources",
        label: "Contact Sources",
        icon: "User",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/room-types",
        label: "Room Types",
        icon: "House",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/room-configurations",
        label: "Room Configurations",
        icon: "House",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/property-amenities",
        label: "Property Amenities",
        icon: "Sparkles",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/room-amenities",
        label: "Room Amenities",
        icon: "Sparkles",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/discount-types",
        label: "Discount Types",
        icon: "Dollar",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/room-requests",
        label: "Room Requests",
        icon: "Check",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/charge-types",
        label: "Booking Charges",
        icon: "Dollar",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/tariffs",
        label: "Tariff Beginning Price",
        icon: "TrendUp",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
      {
        href: "/settings/tariff-plans",
        label: "Tariff",
        icon: "TrendUp",
        group: "manage",
        module: "settings",
        adminOnly: true,
      },
    ],
  },
];

/**
 * Modules an admin can toggle for a user, given that user's role: the
 * role's static defaults, minus always-on / admin-only. Admin role → none
 * (it is full and not customisable).
 */
export function toggleableModulesForRole(roleName: string): ModuleDef[] {
  if (roleName === "admin") return [];
  const def = ROLE_DEFAULTS[roleName] ?? [];
  return def
    .map((c) => BY_CODE.get(c))
    .filter((m): m is ModuleDef => !!m && !m.alwaysOn && !m.adminOnly);
}

/**
 * Effective module set for a user. Admin = everything. Otherwise the
 * role default, intersected with the per-user enabled set when one exists
 * (`null` = no per-user override → full role default). Always-on modules
 * are always included.
 */
export function effectiveModules(
  roleName: string,
  perUserCodes: string[] | null,
): Set<ModuleCode> {
  if (roleName === "admin") return new Set(ALL_CODES);

  const roleDefault = (ROLE_DEFAULTS[roleName] ?? []).filter(
    (c) => !BY_CODE.get(c)?.adminOnly,
  );
  const base =
    perUserCodes == null
      ? roleDefault
      : roleDefault.filter((c) => perUserCodes.includes(c));

  return new Set<ModuleCode>([...ALWAYS_ON, ...base]);
}
