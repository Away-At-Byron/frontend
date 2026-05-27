import "server-only"

import { asc, eq } from "drizzle-orm"
import { discountTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import { computeStatus } from "./status"
import type { DiscountTypeRow } from "./types"

export type { DiscountTypeRow } from "./types"

/**
 * Every active discount, alphabetised by name. Live status is computed
 * server-side (active / scheduled / expired / paused).
 */
export async function listDiscountTypes(): Promise<
  ActionResult<DiscountTypeRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage discount types.")
    }
    const rows = await tx
      .select({
        id: discountTypes.id,
        name: discountTypes.name,
        code: discountTypes.code,
        description: discountTypes.description,
        type: discountTypes.type,
        valueInt: discountTypes.valueInt,
        maxDiscountCents: discountTypes.maxDiscountCents,
        durationStart: discountTypes.durationStart,
        durationEnd: discountTypes.durationEnd,
        activationMode: discountTypes.activationMode,
        minAmountCents: discountTypes.minAmountCents,
        minNights: discountTypes.minNights,
        stackable: discountTypes.stackable,
        createdAt: discountTypes.createdAt,
        updatedAt: discountTypes.updatedAt,
      })
      .from(discountTypes)
      .where(eq(discountTypes.isDeleted, false))
      .orderBy(asc(discountTypes.name))

    return ok(rows.map((r) => ({ ...r, status: computeStatus(r) })))
  })
}
