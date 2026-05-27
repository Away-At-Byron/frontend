import "server-only"

import { asc, eq, sql } from "drizzle-orm"
import { propertyAmenities } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { PropertyAmenityRow } from "./types"

export type { PropertyAmenityRow } from "./types"

/**
 * Every active amenity, ordered by category then sort_order then name.
 * usageCount is always 0 until the property/room amenity assignment table
 * lands - swap in a leftJoin then. Admin-only.
 */
export async function listPropertyAmenities(): Promise<
  ActionResult<PropertyAmenityRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage property amenities.")
    }
    const rows = await tx
      .select({
        id: propertyAmenities.id,
        category: propertyAmenities.category,
        name: propertyAmenities.name,
        sortOrder: propertyAmenities.sortOrder,
        createdAt: propertyAmenities.createdAt,
        updatedAt: propertyAmenities.updatedAt,
      })
      .from(propertyAmenities)
      .where(eq(propertyAmenities.isDeleted, false))
      .orderBy(
        asc(propertyAmenities.category),
        asc(propertyAmenities.sortOrder),
        asc(propertyAmenities.name),
      )

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}

/** Distinct category names from active rows - feeds the combobox in the modal. */
export async function listAmenityCategories(): Promise<ActionResult<string[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage property amenities.")
    }
    const rows = await tx
      .selectDistinct({ category: propertyAmenities.category })
      .from(propertyAmenities)
      .where(eq(propertyAmenities.isDeleted, false))
      .orderBy(asc(propertyAmenities.category))
    return ok(rows.map((r) => r.category))
  })
}
