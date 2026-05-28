import "server-only"

import { asc, eq } from "drizzle-orm"
import { tariffPeriods } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { TariffPeriodRow } from "./types"

export type { TariffPeriodRow } from "./types"

/**
 * Every active tariff period, ordered by start date. Admin-only — tariff
 * periods are an admin-managed Settings catalogue.
 */
export async function listTariffPeriods(): Promise<
  ActionResult<TariffPeriodRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariff periods.")
    }
    const rows = await tx
      .select({
        id: tariffPeriods.id,
        code: tariffPeriods.code,
        description: tariffPeriods.description,
        fromDate: tariffPeriods.fromDate,
        toDate: tariffPeriods.toDate,
        createdAt: tariffPeriods.createdAt,
        updatedAt: tariffPeriods.updatedAt,
      })
      .from(tariffPeriods)
      .where(eq(tariffPeriods.isDeleted, false))
      .orderBy(asc(tariffPeriods.fromDate), asc(tariffPeriods.code))
    return ok(rows)
  })
}
