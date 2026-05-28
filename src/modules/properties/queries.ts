import "server-only"

import { asc, eq } from "drizzle-orm"
import { properties } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, type ActionResult } from "@/lib/result"
import type { PropertyRow } from "./types"

/**
 * List properties visible to the signed-in user. Admin sees every
 * property; a tenanted user sees only their own (the `properties` table
 * is the multi-tenant boundary and has no RLS — scope here).
 */
export async function listProperties(): Promise<ActionResult<PropertyRow[]>> {
  return withTenant(async (tx, ctx) => {
    const base = tx
      .select({
        id: properties.id,
        name: properties.name,
        addressStreet: properties.addressStreet,
        addressSuburb: properties.addressSuburb,
        addressCity: properties.addressCity,
        addressPostcode: properties.addressPostcode,
        numberOfRooms: properties.numberOfRooms,
        propertyColour: properties.propertyColour,
        status: properties.status,
      })
      .from(properties)

    const rows =
      ctx.role === "admin" || !ctx.propertyId
        ? await base.orderBy(asc(properties.name))
        : await base
            .where(eq(properties.id, ctx.propertyId))
            .orderBy(asc(properties.name))

    return ok(
      rows.map((r) => ({
        ...r,
        numberOfRooms: r.numberOfRooms ?? 0,
      })),
    )
  })
}
