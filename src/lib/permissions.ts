/**
 * Static role → permission map. Shipped with the app, not user-edited.
 * Permission checks at the server-action boundary are the source of truth;
 * any UI hiding is UX sugar only (FRS §6.3 AC5).
 */
export type Role = "admin" | "manager" | "front_desk" | "housekeeper" | "accounts"

const PERMISSIONS: Record<Role, Set<string>> = {
  admin: new Set(["*"]),
  manager: new Set([
    "booking.read", "booking.create", "booking.update", "booking.cancel",
    "contact.read", "contact.create", "contact.update",
    "payment.read", "payment.create", "payment.refund",
    "charge.read", "charge.create", "charge.void",
    "room.read", "room.update", "room.status",
    "housekeeping.read", "housekeeping.assign",
    "maintenance.read", "maintenance.create", "maintenance.assign",
    "invoice.read", "invoice.create", "invoice.void",
    "user.read", "user.create", "user.update",
    "report.read",
  ]),
  front_desk: new Set([
    "booking.read", "booking.create", "booking.update",
    "contact.read", "contact.create", "contact.update",
    "payment.read", "payment.create",
    "charge.read", "charge.create",
    "room.read", "room.status",
    "housekeeping.read",
  ]),
  housekeeper: new Set([
    "housekeeping.read", "housekeeping.update",
    "maintenance.create",
    "room.read", "room.status",
  ]),
  accounts: new Set([
    "booking.read",
    "payment.read", "payment.refund",
    "charge.read", "charge.void",
    "invoice.read", "invoice.create", "invoice.void",
    "report.read",
  ]),
}

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role as Role]
  if (!perms) return false
  return perms.has("*") || perms.has(permission)
}
