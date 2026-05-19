import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Layer 0. Per-user module overrides (ADR-003). One row per module a user
 * is allowed to reach. Absence of any row for a user => no override =>
 * the user gets their role's full static default. Does NOT modify `users`.
 */
export const userModuleAccess = pgTable(
  "user_module_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleCode: text("module_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userModuleUnique: unique("user_module_access_user_module_unique").on(
      t.userId,
      t.moduleCode,
    ),
  }),
)

export type UserModuleAccess = typeof userModuleAccess.$inferSelect
