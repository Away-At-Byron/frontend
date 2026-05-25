import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed contact source catalogue (Settings area). Replaces the old
 * `contact_source` enum on `contacts` so the list is editable without a
 * migration. Mirrors `contact_types`. Global, not tenanted (ADR-006).
 */
export const contactSources = pgTable("contact_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id), // nullable for seed/system rows
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  /** Soft delete — keeps historical contact_source_id references intact. */
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type ContactSource = typeof contactSources.$inferSelect
export type NewContactSource = typeof contactSources.$inferInsert
