import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed contact type catalogue (Settings area). Replaces the old
 * `contact_type` enum on `contacts` so the list is editable without a
 * migration. Global, not tenanted — contacts are global (ADR-006).
 */
export const contactTypes = pgTable("contact_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id), // nullable for seed/system rows
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  /** Soft delete — keeps historical contact_type_id references intact. */
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type ContactType = typeof contactTypes.$inferSelect
export type NewContactType = typeof contactTypes.$inferInsert
