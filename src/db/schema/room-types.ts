import { pgTable, uuid, text, timestamp, boolean, smallint } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed room type catalogue (Settings area). Global, not tenanted
 * (ADR-007) - the three properties share the same room vocabulary, so
 * per-property duplication adds no value. Mirrors the contact_types pattern.
 *
 * `default_max_occupancy` is nullable - admin sets it when they want the
 * booking form to pre-fill capacity. A per-room override lives on `rooms`
 * (module 6).
 */
export const roomTypes = pgTable("room_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  defaultMaxOccupancy: smallint("default_max_occupancy"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type RoomType = typeof roomTypes.$inferSelect
export type NewRoomType = typeof roomTypes.$inferInsert
