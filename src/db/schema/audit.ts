import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "read",
  "status_change",
])

/**
 * Layer 0. Append-only. No UPDATE/DELETE from the application layer — a
 * database trigger (added in migration 0010) blocks them. Retained 7 years
 * (AU tax requirement). Every state-changing server action writes here via
 * the audit wrapper in `src/lib/audit.ts`.
 */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  // No FK to users: audit_log is append-only and must survive a user being
  // hard-deleted. The id is kept as a dangling reference (see migration 0009).
  userId: uuid("user_id"),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: auditAction("action").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type AuditLog = typeof auditLog.$inferSelect
