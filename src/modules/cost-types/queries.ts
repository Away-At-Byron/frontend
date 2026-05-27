import "server-only"

import { asc, eq } from "drizzle-orm"
import { costTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { CostTypeRow } from "./types"

export type { CostTypeRow } from "./types"

/**
 * Every active cost type, alphabetised. usageCount is always 0 until the
 * booking cost allocation table lands - swap in a leftJoin then.
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
        defaultRateCents: costTypes.defaultRateCents,
        canOverridden: costTypes.canOverridden,
        isDeduction: costTypes.isDeduction,
        isAddition: costTypes.isAddition,
        createdAt: costTypes.createdAt,
        updatedAt: costTypes.updatedAt,
      })
      .from(costTypes)
      .where(eq(costTypes.isDeleted, false))
      .orderBy(asc(costTypes.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}
