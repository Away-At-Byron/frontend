import { pgTable, uuid, text, timestamp, boolean, smallint } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed property amenity catalogue (Settings area). Single global
 * table per ADR-009: `category` and `name` are columns of one table, not a
 * separate categories table. Categories are derived at read time
 * (SELECT DISTINCT category) and offered as a combobox in the UI.
 */
export const propertyAmenities = pgTable("property_amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  /** Order within category (0 = first). Default falls back to name asc. */
  sortOrder: smallint("sort_order").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type PropertyAmenity = typeof propertyAmenities.$inferSelect
export type NewPropertyAmenity = typeof propertyAmenities.$inferInsert
