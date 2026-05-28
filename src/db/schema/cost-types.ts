import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { costCategories } from "./cost-categories"

/**
 * Admin-managed cost type (Settings area). User-facing label is
 * "Cost Type". Belongs to a cost_category and carries the basis, the
 * default value, and the policy flag that says whether a room may
 * override that value. Global, follows ADR-007.
 *
 * Internal name is `cost_types` because the FRS reserves `costs` for the
 * Layer 1 transactional table.
 *
 * `default_value_int` stores cents for every basis except `percentage`,
 * which stores basis points 0..10000 (15% = 1500). CHECK constraint
 * enforces per-basis range; the action layer converts between integer and
 * human-readable decimal.
 *
 * The Room module applies these later. Per-room behaviour: if
 * `can_be_overridden` is true the room may store its own amount (the
 * "isOverridden + amount" mechanism lives there, not here); otherwise the
 * room uses `default_value_int` as-is.
 */

export const costBasisEnum = pgEnum("cost_basis", [
  "flat",
  "per_night",
  "per_person",
  "per_room",
  "percentage",
])

export const costTypes = pgTable(
  "cost_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    costCategoryId: uuid("cost_category_id")
      .notNull()
      .references(() => costCategories.id, { onDelete: "restrict" }),
    basis: costBasisEnum("basis").notNull().default("flat"),
    defaultValueInt: integer("default_value_int").notNull().default(0),
    canBeOverridden: boolean("can_be_overridden").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "cost_types_default_value_per_basis",
      sql`(
        (${t.basis} = 'percentage' AND ${t.defaultValueInt} BETWEEN 0 AND 10000)
        OR (${t.basis} <> 'percentage' AND ${t.defaultValueInt} >= 0)
      )`,
    ),
  ],
)

export type CostType = typeof costTypes.$inferSelect
export type NewCostType = typeof costTypes.$inferInsert
