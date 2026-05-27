import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed guest type catalogue (Settings area). Replaces the old
 * `guest_type` Postgres enum on `contacts` so the list is editable without
 * a migration (same precedent as `contact_types`/`contact_sources`, ADR-006).
 * Global, not tenanted.
 */
export const guestTypes = pgTable("guest_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type GuestType = typeof guestTypes.$inferSelect
export type NewGuestType = typeof guestTypes.$inferInsert
