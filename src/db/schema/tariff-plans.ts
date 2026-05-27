import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { tariffs } from "./tariffs"
import { roomTypes } from "./room-types"

/**
 * Admin-managed tariff catalogue (Settings area). User-facing label is
 * "Tariff". A tariff binds a base price category (tariffs.id) to a
 * property and room type, and carries a status. Global, follows ADR-007.
 *
 * Table name is `tariff_plans` because `tariffs` is taken by the Tariff
 * Beginning Price catalogue (label-only).
 *
 * `property_id` is intentionally a plain uuid with NO foreign key per the
 * client's instruction. When the relationship is firmed up, add the FK in
 * a follow-up migration.
 */

export const tariffStatusEnum = pgEnum("tariff_status", ["active", "inactive"])

export const tariffPlans = pgTable("tariff_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  tariffBeginningPriceId: uuid("tariff_beginning_price_id")
    .notNull()
    .references(() => tariffs.id, { onDelete: "restrict" }),
  /** Plain uuid; no FK to `properties` per client instruction. */
  propertyId: uuid("property_id").notNull(),
  roomTypeId: uuid("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "restrict" }),
  status: tariffStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type TariffPlan = typeof tariffPlans.$inferSelect
export type NewTariffPlan = typeof tariffPlans.$inferInsert
