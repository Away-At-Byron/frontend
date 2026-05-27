import "server-only"

import { asc, eq } from "drizzle-orm"
import { costCategories, costTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { CostCategoryRow, CostTypeOption } from "./types"

export type { CostCategoryRow, Option, CostTypeOption } from "./types"

/**
 * Every active cost category with its cost-type name resolved. Ordered by
 * cost type then name. Admin-only.
 */
export async function listCostCategories(): Promise<
  ActionResult<CostCategoryRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage cost categories.")
    }
    const rows = await tx
      .select({
        id: costCategories.id,
        name: costCategories.name,
        costTypeId: costCategories.costTypeId,
        costTypeName: costTypes.name,
        costTypeDefaultRateCents: costTypes.defaultRateCents,
        basis: costCategories.basis,
        amountInt: costCategories.amountInt,
        isOverridden: costCategories.isOverridden,
        isActive: costCategories.isActive,
        createdAt: costCategories.createdAt,
        updatedAt: costCategories.updatedAt,
      })
      .from(costCategories)
      .innerJoin(costTypes, eq(costTypes.id, costCategories.costTypeId))
      .where(eq(costCategories.isDeleted, false))
      .orderBy(asc(costTypes.name), asc(costCategories.name))

    return ok(rows)
  })
}

/**
 * Active cost types for the modal dropdown. Includes `defaultRateCents` so
 * the modal can auto-prefill the Amount field when a cost type is picked.
 */
export async function listCostTypeOptions(): Promise<
  ActionResult<CostTypeOption[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage cost categories.")
    }
    const rows = await tx
      .select({
        id: costTypes.id,
        name: costTypes.name,
        defaultRateCents: costTypes.defaultRateCents,
      })
      .from(costTypes)
      .where(eq(costTypes.isDeleted, false))
      .orderBy(asc(costTypes.name))
    return ok(rows)
  })
}
