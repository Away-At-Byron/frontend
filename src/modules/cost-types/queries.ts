import "server-only"

import { asc, eq } from "drizzle-orm"
import { costCategories, costTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { CostTypeRow, Option } from "./types"

export type { CostTypeRow, Option } from "./types"

/**
 * Every active cost type with its cost-category name resolved. Ordered by
 * cost category then name. Admin-only.
 */
export async function listCostTypes(): Promise<ActionResult<CostTypeRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage cost types.")
    }
    const rows = await tx
      .select({
        id: costTypes.id,
        name: costTypes.name,
        costCategoryId: costTypes.costCategoryId,
        costCategoryName: costCategories.name,
        basis: costTypes.basis,
        defaultValueInt: costTypes.defaultValueInt,
        canBeOverridden: costTypes.canBeOverridden,
        isActive: costTypes.isActive,
        createdAt: costTypes.createdAt,
        updatedAt: costTypes.updatedAt,
      })
      .from(costTypes)
      .innerJoin(
        costCategories,
        eq(costCategories.id, costTypes.costCategoryId),
      )
      .where(eq(costTypes.isDeleted, false))
      .orderBy(asc(costCategories.name), asc(costTypes.name))

    return ok(rows)
  })
}

/** Active cost categories for the cost-type modal dropdown. */
export async function listCostCategoryOptions(): Promise<
  ActionResult<Option[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage cost types.")
    }
    const rows = await tx
      .select({ id: costCategories.id, name: costCategories.name })
      .from(costCategories)
      .where(eq(costCategories.isDeleted, false))
      .orderBy(asc(costCategories.name))
    return ok(rows)
  })
}
