import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  date,
  pgEnum,
  check,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"

/**
 * Discount catalogue (Settings area). Global, follows ADR-007 precedent.
 *
 * `value_int` stores either cents (for flat / cashback) or basis points
 * 0..10000 (for percentage). CHECK constraints enforce ranges per type
 * and the validator in actions.ts converts between the integer and the
 * human-facing decimal.
 *
 * Activation:
 * - `duration`: active iff current_date is within [duration_start,
 *   duration_end]. Null bounds mean open-ended.
 * - `manual`: active by row existence. To pause, switch to `duration`
 *   with a past `duration_end`, or soft-delete.
 *
 * Cashback in v1 behaves identically to `flat` (cents); the type label is
 * stored so a future payment integration can branch on it.
 */

export const discountTypeKindEnum = pgEnum("discount_type_kind", [
  "percentage",
  "flat",
  "cashback",
])

export const discountActivationModeEnum = pgEnum(
  "discount_activation_mode",
  ["duration", "manual"],
)

export const discountTypes = pgTable(
  "discount_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    type: discountTypeKindEnum("type").notNull(),
    /** Cents for flat / cashback. Basis points 0..10000 for percentage. */
    valueInt: integer("value_int").notNull(),
    /** Caps the percentage discount (cents). Ignored for flat / cashback. */
    maxDiscountCents: integer("max_discount_cents"),
    durationStart: date("duration_start"),
    durationEnd: date("duration_end"),
    activationMode: discountActivationModeEnum("activation_mode")
      .notNull()
      .default("duration"),
    minAmountCents: integer("min_amount_cents"),
    minNights: smallint("min_nights"),
    stackable: boolean("stackable").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    // value_int must be in the right range for its type.
    check(
      "discount_types_value_int_per_type",
      sql`(
        (${t.type} = 'percentage' AND ${t.valueInt} BETWEEN 0 AND 10000)
        OR (${t.type} IN ('flat', 'cashback') AND ${t.valueInt} >= 0)
      )`,
    ),
    check(
      "discount_types_duration_order",
      sql`(${t.durationStart} IS NULL OR ${t.durationEnd} IS NULL OR ${t.durationEnd} >= ${t.durationStart})`,
    ),
    check(
      "discount_types_min_nights_positive",
      sql`(${t.minNights} IS NULL OR ${t.minNights} >= 1)`,
    ),
    check(
      "discount_types_max_discount_nonneg",
      sql`(${t.maxDiscountCents} IS NULL OR ${t.maxDiscountCents} >= 0)`,
    ),
    check(
      "discount_types_min_amount_nonneg",
      sql`(${t.minAmountCents} IS NULL OR ${t.minAmountCents} >= 0)`,
    ),
  ],
)

export type DiscountType = typeof discountTypes.$inferSelect
export type NewDiscountType = typeof discountTypes.$inferInsert
