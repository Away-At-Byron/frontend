/**
 * Permission codes this module checks. Keep them granular and verbed.
 * The actual role→code map lives in src/lib/permissions.ts (static).
 */
export const EXAMPLE_PERMISSIONS = {
  read: "example.read",
  create: "example.create",
  update: "example.update",
} as const
