"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import {
  tariffPlans,
  tariffs,
  roomTypes,
  properties,
} from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createTariffPlanSchema,
  updateTariffPlanSchema,
  type CreateTariffPlanInput,
  type UpdateTariffPlanInput,
} from "./schemas"
import type { TariffPlanRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage tariffs.")
  }
  return null
}

async function codeTaken(
  tx: Tx,
  code: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: tariffPlans.id })
    .from(tariffPlans)
    .where(
      and(
        eq(tariffPlans.isDeleted, false),
        sql`lower(${tariffPlans.code}) = lower(${code})`,
        exceptId ? ne(tariffPlans.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(tx: Tx, id: string): Promise<TariffPlanRow | null> {
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
    .where(eq(tariffPlans.id, id))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Verify the FK targets are real and active before we let the row land.
 * `property_id` has no FK constraint - we still check that the uuid points
 * at an existing property here.
 */
async function validateRefs(
  tx: Tx,
  data: CreateTariffPlanInput,
): Promise<ActionErr | null> {
  const [tariff] = await tx
    .select({ id: tariffs.id })
    .from(tariffs)
    .where(
      and(eq(tariffs.id, data.tariffBeginningPriceId), eq(tariffs.isDeleted, false)),
    )
    .limit(1)
  if (!tariff) {
    return err("VALIDATION", "Check the highlighted fields.", {
      tariffBeginningPriceId: ["That tariff no longer exists"],
    })
  }
  const [rt] = await tx
    .select({ id: roomTypes.id })
    .from(roomTypes)
    .where(and(eq(roomTypes.id, data.roomTypeId), eq(roomTypes.isDeleted, false)))
    .limit(1)
  if (!rt) {
    return err("VALIDATION", "Check the highlighted fields.", {
      roomTypeId: ["That room type no longer exists"],
    })
  }
  const [prop] = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.id, data.propertyId))
    .limit(1)
  if (!prop) {
    return err("VALIDATION", "Check the highlighted fields.", {
      propertyId: ["That property no longer exists"],
    })
  }
  return null
}

export async function createTariffPlan(
  input: CreateTariffPlanInput,
): Promise<ActionResult<TariffPlanRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createTariffPlanSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const refErr = await validateRefs(tx, parsed.data)
    if (refErr) return refErr

    if (await codeTaken(tx, parsed.data.code)) {
      return err("CONFLICT", "A tariff with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    const inserted = await tx
      .insert(tariffPlans)
      .values({ ...parsed.data, createdBy: ctx.userId })
      .returning({ id: tariffPlans.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new tariff.")

    await writeAudit({
      ctx,
      entityType: "tariff_plan",
      entityId: id,
      action: "create",
      newValue: parsed.data,
    })

    return ok(row)
  })
}

export async function updateTariffPlan(
  id: string,
  input: UpdateTariffPlanInput,
): Promise<ActionResult<TariffPlanRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateTariffPlanSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(tariffPlans)
      .where(and(eq(tariffPlans.id, id), eq(tariffPlans.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff no longer exists.")
    }

    const refErr = await validateRefs(tx, parsed.data)
    if (refErr) return refErr

    if (await codeTaken(tx, parsed.data.code, id)) {
      return err("CONFLICT", "A tariff with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    await tx
      .update(tariffPlans)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(tariffPlans.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That tariff no longer exists.")

    await writeAudit({
      ctx,
      entityType: "tariff_plan",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        code: existing[0].code,
        status: existing[0].status,
      },
      newValue: parsed.data,
    })

    return ok(row)
  })
}

export async function deleteTariffPlan(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({
        id: tariffPlans.id,
        name: tariffPlans.name,
        code: tariffPlans.code,
      })
      .from(tariffPlans)
      .where(and(eq(tariffPlans.id, id), eq(tariffPlans.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff no longer exists.")
    }

    await tx
      .update(tariffPlans)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(tariffPlans.id, id))

    await writeAudit({
      ctx,
      entityType: "tariff_plan",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name, code: existing[0].code },
    })

    return ok({ id })
  })
}
