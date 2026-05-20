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
  | "users";

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
  contractor: [],
  other: [],
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
  href: string;
  label: string;
  icon: IconName;
  group: "today" | "manage";
  module: ModuleCode;
  badge?: number;
  /** Visible to the admin role only, bypassing module access. */
  adminOnly?: boolean;
};

export const NAV_ENTRIES: NavEntry[] = [
  {
    href: "/home",
    label: "Dashboard",
    icon: "Layout",
    group: "today",
    module: "dashboard",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: "Grid",
    group: "today",
    module: "calendar",
  },
  {
    href: "/bookings/new",
    label: "New booking",
    icon: "Plus",
    group: "today",
    module: "bookings",
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    icon: "Sparkles",
    group: "today",
    module: "housekeeping",
  },
  {
    href: "/bookings",
    label: "Reservations",
    icon: "Bed",
    group: "manage",
    module: "bookings",
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: "User",
    group: "manage",
    module: "contacts",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: "Message",
    group: "manage",
    module: "messages",
    badge: 3,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "Sparkline",
    group: "manage",
    module: "reports",
  },
  {
    href: "/setup",
    label: "Setup",
    icon: "Settings",
    group: "manage",
    module: "setup",
  },
  {
    href: "/users",
    label: "Users",
    icon: "User",
    group: "manage",
    module: "users",
    adminOnly: true,
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
