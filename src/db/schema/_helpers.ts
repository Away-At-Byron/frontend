import { uuid, timestamp } from "drizzle-orm/pg-core"
import { properties } from "./properties"
import { users } from "./auth"

/**
 * Standard tenanted columns. Spread into every Layer 1+ table:
 *   pgTable("foo", { ...tenantCols, name: text("name").notNull() })
 * Keeps the FRS §4 convention DRY and the RLS gate consistent.
 */
export const tenantCols = {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Nullable: system actions, or the creating user was later hard-deleted
  // (the FK sets this to null on delete - see migration 0009).
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
}
