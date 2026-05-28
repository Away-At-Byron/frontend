import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { users } from "./auth"

export const tariffTrafficEnum = pgEnum("tariff_traffic", [
  "ota",
  "direct",
  "other",
])

/**
 * Admin-managed tariff catalogue (Settings area). User-facing label is
 * "Tariff Type" - the starting-rate categories applied to
 * bookings (Standard Weekday Rate, Peak Season, Non-Refundable, …).
 * Global, follows ADR-007. Name-only.
 *
 * Distinct from the future FRS Layer 1 `rate_plans` table, which will
 * carry actual nightly prices, restrictions, and cancellation policies.
 * This catalogue is just the label vocabulary.
 */
export const tariffs = pgTable("tariffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  traffic: tariffTrafficEnum("traffic").notNull().default("direct"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type Tariff = typeof tariffs.$inferSelect
export type NewTariff = typeof tariffs.$inferInsert
