import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  date,
  check,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"

/**
 * Admin-managed tariff period catalogue (Settings area). A tariff period is
 * a labelled date range (e.g. "Peak 2026", "Winter Off-Peak") that future
 * rate plans can attach prices to. Global, follows ADR-007.
 *
 * Distinct from `tariffs` (the rate-label catalogue): this table carries
 * the time dimension, `tariffs` carries the label vocabulary.
 */
export const tariffPeriods = pgTable(
  "tariff_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    description: text("description"),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "tariff_periods_date_order",
      sql`${t.toDate} >= ${t.fromDate}`,
    ),
  ],
)

export type TariffPeriod = typeof tariffPeriods.$inferSelect
export type NewTariffPeriod = typeof tariffPeriods.$inferInsert
