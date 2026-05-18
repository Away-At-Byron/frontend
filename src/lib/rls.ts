import "server-only"
import { sql } from "drizzle-orm"
import { db } from "@/db"
import { auth } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { err, type ActionResult } from "@/lib/result"

export type TenantContext = {
  userId: string
  role: string
  propertyId: string | null // null = admin (cross-property)
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Opens a transaction with the per-request GUCs every RLS policy reads:
 *   app.property_id, app.role, app.user_id
 * Never query tenanted tables outside this wrapper (CLAUDE.md rule 3).
 * Returns the tagged-union error shape on auth failure — never throws
 * across the wire.
 */
export async function withTenant<T>(
  fn: (tx: Tx, ctx: TenantContext) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const session = await auth()
  if (!session?.user?.id) {
    return err("UNAUTHENTICATED", "You are not signed in.")
  }
  const ctx: TenantContext = {
    userId: session.user.id,
    role: session.user.role,
    propertyId: session.user.propertyId,
  }

  return db.transaction(async (tx) => {
    if (ctx.propertyId) {
      await tx.execute(
        sql`SELECT set_config('app.property_id', ${ctx.propertyId}, true)`,
      )
    }
    await tx.execute(sql`SELECT set_config('app.role', ${ctx.role}, true)`)
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`)
    return fn(tx, ctx)
  })
}

/**
 * Permission gate. The server-action boundary is the source of truth;
 * UI hiding is UX only.
 */
export async function withPermission<T>(
  permission: string,
  ctx: TenantContext,
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  if (!hasPermission(ctx.role, permission)) {
    return err("FORBIDDEN", `You don't have permission to ${permission}.`)
  }
  return fn()
}
