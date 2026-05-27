import "server-only"

import { asc, count, eq } from "drizzle-orm"
import { contacts, guestTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { GuestTypeRow } from "./types"

export type { GuestTypeRow } from "./types"

/**
 * Every active guest type with a live contact count. Admin-only - this is
 * an admin-managed catalogue exposed only on the Settings page.
 */
export async function listGuestTypes(): Promise<ActionResult<GuestTypeRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage guest types.")
    }
    const rows = await tx
      .select({
        id: guestTypes.id,
        name: guestTypes.name,
        createdAt: guestTypes.createdAt,
        updatedAt: guestTypes.updatedAt,
        contactCount: count(contacts.id),
      })
      .from(guestTypes)
      .leftJoin(contacts, eq(contacts.guestTypeId, guestTypes.id))
      .where(eq(guestTypes.isDeleted, false))
      .groupBy(guestTypes.id)
      .orderBy(asc(guestTypes.name))
    return ok(rows)
  })
}
