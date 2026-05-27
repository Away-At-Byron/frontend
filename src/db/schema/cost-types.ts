import { pgTable, uuid, text, timestamp, boolean, integer, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"

/**
 * Admin-managed cost catalogue (Settings area). User-facing label is
 * "Cost Types". Each row defines a cost item that can be applied to a
 * booking with a default rate and flags describing whether it adds to or
 * deducts from the total, and whether the rate can be overridden per
 * booking. Global, follows ADR-007.
 *
 * Internal name is `cost_types` because the FRS reserves `costs` for the
 * Layer 1 transactional table.
 *
 * `default_rate_cents` is integer cents per CLAUDE.md rule 4. If a future
 * version needs a percentage variant, add a `rate_kind` column and split
 * the value.
 */
export const costTypes = pgTable(
  "cost_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    defaultRateCents: integer("default_rate_cents").notNull().default(0),
    canOverridden: boolean("can_overridden").notNull().default(true),
    isDeduction: boolean("is_deduction").notNull().default(false),
    isAddition: boolean("is_addition").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "cost_types_default_rate_nonneg",
      sql`${t.defaultRateCents} >= 0`,
    ),
  ],
)

export type CostType = typeof costTypes.$inferSelect
export type NewCostType = typeof costTypes.$inferInsert
