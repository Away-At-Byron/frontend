import { pgTable, uuid, text, timestamp, boolean, integer, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"

/**
 * Admin-managed catalogue of charge items that can be added to an invoice
 * (Bond, Cleaning Fee, Late Check-Out, …). User-facing label is "Booking
 * Charges". The internal table name is `charge_types` to avoid collision
 * with the Layer 3 `booking_charges` table that records actual charges
 * applied to bookings.
 *
 * Global, follows ADR-007. Amount stored as integer cents (CLAUDE.md
 * rule 4); the action layer multiplies the dollar input by 100.
 */
export const chargeTypes = pgTable(
  "charge_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Default amount applied when this charge is added to an invoice. Cents. */
    defaultAmountCents: integer("default_amount_cents").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "charge_types_default_amount_nonneg",
      sql`${t.defaultAmountCents} >= 0`,
    ),
  ],
)

export type ChargeType = typeof chargeTypes.$inferSelect
export type NewChargeType = typeof chargeTypes.$inferInsert
