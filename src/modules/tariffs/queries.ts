import "server-only"

import { asc, eq } from "drizzle-orm"
import { properties, tariffPeriods, tariffs } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { Option, TariffRow } from "./types"

export type { Option, TariffRow } from "./types"

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
        code: tariffs.code,
        tariffBasis: tariffs.tariffBasis,
        refundable: tariffs.refundable,
        breakfastIncluded: tariffs.breakfastIncluded,
        traffic: tariffs.traffic,
        status: tariffs.status,
        propertyId: tariffs.propertyId,
        propertyName: properties.name,
        roomId: tariffs.roomId,
        tariffPeriodId: tariffs.tariffPeriodId,
        tariffPeriodCode: tariffPeriods.code,
        createdAt: tariffs.createdAt,
        updatedAt: tariffs.updatedAt,
      })
      .from(tariffs)
      .leftJoin(properties, eq(properties.id, tariffs.propertyId))
      .leftJoin(tariffPeriods, eq(tariffPeriods.id, tariffs.tariffPeriodId))
      .where(eq(tariffs.isDeleted, false))
      .orderBy(asc(tariffs.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}

/** All properties for the modal "Property" dropdown. */
export async function listPropertyOptions(): Promise<ActionResult<Option[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .orderBy(asc(properties.name))
    return ok(rows)
  })
}

/** Active tariff periods for the modal "Tariff Period" dropdown. */
export async function listTariffPeriodOptions(): Promise<
  ActionResult<Option[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({ id: tariffPeriods.id, name: tariffPeriods.code })
      .from(tariffPeriods)
      .where(eq(tariffPeriods.isDeleted, false))
      .orderBy(asc(tariffPeriods.code))
    return ok(rows)
  })
}
