import "server-only"

import { asc, count, eq } from "drizzle-orm"
import { contacts, contactSources } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { ContactSourceRow } from "./types"

export type { ContactSourceRow } from "./types"

/**
 * Every active contact source, each with a count of the contacts using it.
 * Admin-only — contact sources are an admin-managed Settings catalogue.
 */
export async function listContactSources(): Promise<
  ActionResult<ContactSourceRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage contact sources.")
    }
    const rows = await tx
      .select({
        id: contactSources.id,
        name: contactSources.name,
        createdAt: contactSources.createdAt,
        updatedAt: contactSources.updatedAt,
        contactCount: count(contacts.id),
      })
      .from(contactSources)
      .leftJoin(contacts, eq(contacts.contactSourceId, contactSources.id))
      .where(eq(contactSources.isDeleted, false))
      .groupBy(contactSources.id)
      .orderBy(asc(contactSources.name))
    return ok(rows)
  })
}
