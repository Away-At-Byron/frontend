import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { users } from "./auth"

/**
 * Group booking — one Primary contact books multiple rooms for multiple
 * related contacts. `group_name` is the unique key that ties members
 * together; each member's `contacts.group_id` points here. "Primary" vs
 * "Standard" is encoded in the member's contact type, not stored here.
 * Global, not tenanted (ADR-006).
 */
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupName: text("group_name").notNull(),
    /** Free-text notes on how the group members relate. */
    relationships: text("relationships"),
    companyName: text("company_name"),
    corporateAccountId: text("corporate_account_id"),
    travelAgentId: text("travel_agent_id"),
    groupBookerFlag: boolean("group_booker_flag").notNull().default(false),
    billingPreference: text("billing_preference"),
    taxAbn: text("tax_abn"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [uniqueIndex("groups_group_name_unique").on(t.groupName)],
)

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
