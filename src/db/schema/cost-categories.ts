import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed cost category bucket (Settings area). Just a name. Each
 * cost_type belongs to exactly one cost_category. User-facing label is
 * "Cost Category". Global, follows ADR-007.
 *
 * Initial values seeded in migration 0033: Housekeeping, Consumables,
 * Linen, Damages.
 */
export const costCategories = pgTable("cost_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type CostCategory = typeof costCategories.$inferSelect
export type NewCostCategory = typeof costCategories.$inferInsert
