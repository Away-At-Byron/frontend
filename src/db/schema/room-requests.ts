import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Admin-managed room request catalogue (Settings area). The list of common
 * room requirements a booking can be tagged with (Early Check-In, Extra
 * Bed, Late Arrival, …). Global; follows ADR-007.
 *
 * `code` is an optional short identifier. Uniqueness on both name and code
 * (case-insensitive, among active rows) is enforced by partial unique
 * indexes on the table.
 */
export const roomRequests = pgTable("room_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
})

export type RoomRequest = typeof roomRequests.$inferSelect
export type NewRoomRequest = typeof roomRequests.$inferInsert
