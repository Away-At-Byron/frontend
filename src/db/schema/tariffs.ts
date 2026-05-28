import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { tariffPeriods } from "./tariff-periods"

export const tariffTrafficEnum = pgEnum("tariff_traffic", [
  "ota",
  "direct",
  "other",
])

export const tariffBasisEnum = pgEnum("tariff_basis", [
  "per_night",
  "per_week",
  "long_stay",
])

export const tariffStatusEnum = pgEnum("tariff_status", ["active", "inactive"])

/**
 * Admin-managed tariff catalogue. User-facing label is "Tariff Type".
 * A row binds a named rate label to a basis (Per Night, Per Week, Long
 * Stay), a refundable/breakfast posture, and an optional property/room
 * scope.
 *
 * `property_id` is NULL when the tariff applies to every property.
 * `room_id` is NULL when the tariff applies to every room within its
 * property scope. Both are plain uuids with no FK constraint
 * (`property_id` follows the precedent set by the now-removed
 * `tariff_plans`; `room_id` is a placeholder for the rooms table that
 * will land later).
 */
export const tariffs = pgTable("tariffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  tariffBasis: tariffBasisEnum("tariff_basis").notNull(),
  refundable: boolean("refundable").notNull().default(true),
  breakfastIncluded: boolean("breakfast_included").notNull().default(false),
  traffic: tariffTrafficEnum("traffic").notNull().default("direct"),
  status: tariffStatusEnum("status").notNull().default("active"),
  /** Plain uuid; null means "all properties". */
  propertyId: uuid("property_id"),
  /** Plain uuid; null means "all rooms in scope". Rooms table lands later. */
  roomId: uuid("room_id"),
  /** Optional FK to a labelled date range from `tariff_periods`. */
  tariffPeriodId: uuid("tariff_period_id").references(
    () => tariffPeriods.id,
    { onDelete: "set null" },
  ),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type Tariff = typeof tariffs.$inferSelect
export type NewTariff = typeof tariffs.$inferInsert
