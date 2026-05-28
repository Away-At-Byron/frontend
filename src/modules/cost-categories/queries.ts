import "server-only"

import { and, asc, count, eq } from "drizzle-orm"
import { costCategories, costTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { CostCategoryRow } from "./types"

export type { CostCategoryRow } from "./types"

/**
 * Every active cost category with the count of active cost types that
 * point at it. Admin-only.
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
        createdAt: costCategories.createdAt,
        updatedAt: costCategories.updatedAt,
        costTypeCount: count(costTypes.id),
      })
      .from(costCategories)
      .leftJoin(
        costTypes,
        and(
          eq(costTypes.costCategoryId, costCategories.id),
          eq(costTypes.isDeleted, false),
        ),
      )
      .where(eq(costCategories.isDeleted, false))
      .groupBy(costCategories.id)
      .orderBy(asc(costCategories.name))
    return ok(rows)
  })
}
