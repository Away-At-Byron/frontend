import "server-only"

import { asc, eq } from "drizzle-orm"
import {
  tariffPlans,
  tariffs,
  roomTypes,
  properties,
} from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { Option, TariffPlanRow } from "./types"

export type { TariffPlanRow, Option } from "./types"

/**
 * Every active tariff plan, alphabetised by name. Joins to `tariffs` and
 * `room_types` for FK labels; `properties` is left-joined (uuid match)
 * because `property_id` is not a real FK in this table.
 */
export async function listTariffPlans(): Promise<
  ActionResult<TariffPlanRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({
        id: tariffPlans.id,
        name: tariffPlans.name,
        code: tariffPlans.code,
        tariffBeginningPriceId: tariffPlans.tariffBeginningPriceId,
        tariffBeginningPriceName: tariffs.name,
        propertyId: tariffPlans.propertyId,
        propertyName: properties.name,
        roomTypeId: tariffPlans.roomTypeId,
        roomTypeName: roomTypes.name,
        status: tariffPlans.status,
        createdAt: tariffPlans.createdAt,
        updatedAt: tariffPlans.updatedAt,
      })
      .from(tariffPlans)
      .innerJoin(tariffs, eq(tariffs.id, tariffPlans.tariffBeginningPriceId))
      .innerJoin(roomTypes, eq(roomTypes.id, tariffPlans.roomTypeId))
      .leftJoin(properties, eq(properties.id, tariffPlans.propertyId))
      .where(eq(tariffPlans.isDeleted, false))
      .orderBy(asc(tariffPlans.name))

    return ok(rows)
  })
}

/** Active tariffs (Tariff Type) for the modal dropdown. */
export async function listTariffOptions(): Promise<ActionResult<Option[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({ id: tariffs.id, name: tariffs.name })
      .from(tariffs)
      .where(eq(tariffs.isDeleted, false))
      .orderBy(asc(tariffs.name))
    return ok(rows)
  })
}

/** Active room types for the modal dropdown. */
export async function listRoomTypeOptions(): Promise<ActionResult<Option[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage tariffs.")
    }
    const rows = await tx
      .select({ id: roomTypes.id, name: roomTypes.name })
      .from(roomTypes)
      .where(eq(roomTypes.isDeleted, false))
      .orderBy(asc(roomTypes.name))
    return ok(rows)
  })
}

/** All properties for the modal dropdown. */
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
