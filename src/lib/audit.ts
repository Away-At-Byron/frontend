import "server-only"
import { db } from "@/db"
import { auditLog } from "@/db/schema"
import type { TenantContext } from "@/lib/rls"

type AuditAction = "create" | "update" | "delete" | "read" | "status_change"

/**
 * Append a row to the shared audit_log. Call after every state-changing
 * server action (CLAUDE.md rule: audit on every mutation). Append-only —
 * a DB trigger (migration 0010) blocks UPDATE/DELETE on this table.
 */
export async function writeAudit(opts: {
  ctx: TenantContext
  entityType: string
  entityId: string
  action: AuditAction
  oldValue?: unknown
  newValue?: unknown
}): Promise<void> {
  await db.insert(auditLog).values({
    userId: opts.ctx.userId,
    entityType: opts.entityType,
    entityId: opts.entityId,
    action: opts.action,
    oldValue: opts.oldValue ?? null,
    newValue: opts.newValue ?? null,
  })
}
