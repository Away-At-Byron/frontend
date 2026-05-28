import "server-only"

import { asc, eq } from "drizzle-orm"
import { tariffs } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { TariffRow } from "./types"

export type { TariffRow } from "./types"

/**
 * Every active tariff, alphabetised. usageCount is always 0 until rate_plans
 * lands - swap in a leftJoin then. Admin-only.
 */
export async function listTariffs(): Promise<ActionResult<TariffRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({
        id: tariffs.id,
        name: tariffs.name,
        traffic: tariffs.traffic,
        createdAt: tariffs.createdAt,
        updatedAt: tariffs.updatedAt,
      })
      .from(tariffs)
      .where(eq(tariffs.isDeleted, false))
      .orderBy(asc(tariffs.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}
