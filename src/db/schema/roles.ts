import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core"

/**
 * Layer 0. Default roles are seeded from the client model:
 * admin, manager, front_desk, housekeeper, accounts.
 * Permission codes live in `src/lib/permissions.ts` (static, shipped with
 * the app). `permissionSet` jsonb exists only for per-deployment overrides.
 */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  permissionSet: jsonb("permission_set").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
