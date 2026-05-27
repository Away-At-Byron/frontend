import "server-only"

import { asc, eq } from "drizzle-orm"
import { chargeTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { ChargeTypeRow } from "./types"

export type { ChargeTypeRow } from "./types"

/**
 * Every active charge type, alphabetised. usageCount is always 0 until
 * invoice_lines lands - swap in a leftJoin then. Admin-only.
 */
export async function listChargeTypes(): Promise<
  ActionResult<ChargeTypeRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage booking charges.")
    }
    const rows = await tx
      .select({
        id: chargeTypes.id,
        name: chargeTypes.name,
        defaultAmountCents: chargeTypes.defaultAmountCents,
        createdAt: chargeTypes.createdAt,
        updatedAt: chargeTypes.updatedAt,
      })
      .from(chargeTypes)
      .where(eq(chargeTypes.isDeleted, false))
      .orderBy(asc(chargeTypes.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}
