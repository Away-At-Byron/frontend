import { pgTable, uuid, text, timestamp, boolean, smallint } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed room configuration catalogue (Settings area). Global, not
 * tenanted (ADR-008) - the three properties share descriptive layout
 * strings. Sits below room_type on a room ("Apartment" room_type with
 * "King Ensuite, Kitchen, Living" room_configuration).
 *
 * `default_max_occupancy` is nullable - admin sets it when they want the
 * booking form to pre-fill capacity from the configuration.
 */
export const roomConfigurations = pgTable("room_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  defaultMaxOccupancy: smallint("default_max_occupancy"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type RoomConfiguration = typeof roomConfigurations.$inferSelect
export type NewRoomConfiguration = typeof roomConfigurations.$inferInsert
