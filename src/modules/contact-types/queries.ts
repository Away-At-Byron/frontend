import "server-only"

import { asc, count, eq } from "drizzle-orm"
import { contacts, contactTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { ContactTypeRow } from "./types"

export type { ContactTypeRow } from "./types"

/**
 * Every active contact type, each with a count of the contacts using it.
 * Admin-only — contact types are an admin-managed Settings catalogue.
 */
export async function listContactTypes(): Promise<
  ActionResult<ContactTypeRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage contact types.")
    }
    const rows = await tx
      .select({
        id: contactTypes.id,
        name: contactTypes.name,
        createdAt: contactTypes.createdAt,
        updatedAt: contactTypes.updatedAt,
        contactCount: count(contacts.id),
      })
      .from(contactTypes)
      .leftJoin(contacts, eq(contacts.contactTypeId, contactTypes.id))
      .where(eq(contactTypes.isDeleted, false))
      .groupBy(contactTypes.id)
      .orderBy(asc(contactTypes.name))
    return ok(rows)
  })
}
