import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed room amenity catalogue (Settings area). Global, not
 * tenanted - same precedent as room_types (ADR-007). Distinct from
 * property_amenities: this catalogue is the per-room list (what an
 * individual room has), while property_amenities sits at the property
 * level (what the whole property offers). Name-only; no category.
 */
export const roomAmenities = pgTable("room_amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type RoomAmenity = typeof roomAmenities.$inferSelect
export type NewRoomAmenity = typeof roomAmenities.$inferInsert
