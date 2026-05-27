import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { costTypes } from "./cost-types"

/**
 * Admin-managed cost category catalogue (Settings area). Each row is a
 * named variant of a cost type with its own basis (how the amount is
 * applied) and amount value. User-facing label is "Cost Categories".
 * Global, follows ADR-007.
 *
 * `amount_int` stores cents for every basis except `percentage`, which
 * stores basis points 0..10000 (15% = 1500). CHECK constraints enforce
 * the per-basis range; the action layer converts between integer and
 * human-readable decimal.
 */

export const costBasisEnum = pgEnum("cost_basis", [
  "flat",
  "per_night",
  "per_person",
  "per_room",
  "percentage",
])

export const costCategories = pgTable(
  "cost_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    costTypeId: uuid("cost_type_id")
      .notNull()
      .references(() => costTypes.id, { onDelete: "restrict" }),
    basis: costBasisEnum("basis").notNull().default("flat"),
    amountInt: integer("amount_int").notNull().default(0),
    isOverridden: boolean("is_overridden").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "cost_categories_amount_per_basis",
      sql`(
        (${t.basis} = 'percentage' AND ${t.amountInt} BETWEEN 0 AND 10000)
        OR (${t.basis} <> 'percentage' AND ${t.amountInt} >= 0)
      )`,
    ),
  ],
)

export type CostCategory = typeof costCategories.$inferSelect
export type NewCostCategory = typeof costCategories.$inferInsert
