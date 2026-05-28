"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { properties, tariffPeriods, tariffs } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createTariffSchema,
  updateTariffSchema,
  type CreateTariffInput,
  type UpdateTariffInput,
} from "./schemas"
import type { TariffRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage tariffs.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: tariffs.id })
    .from(tariffs)
    .where(
      and(
        eq(tariffs.isDeleted, false),
        sql`lower(${tariffs.name}) = lower(${name})`,
        exceptId ? ne(tariffs.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function codeTaken(
  tx: Tx,
  code: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: tariffs.id })
    .from(tariffs)
    .where(
      and(
        eq(tariffs.isDeleted, false),
        sql`lower(${tariffs.code}) = lower(${code})`,
        exceptId ? ne(tariffs.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/** Validate the optional property uuid actually exists. */
async function validatePropertyRef(
  tx: Tx,
  propertyId: string | null,
): Promise<ActionErr | null> {
  if (!propertyId) return null
  const [prop] = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1)
  if (!prop) {
    return err("VALIDATION", "Check the highlighted fields.", {
      propertyId: ["That property no longer exists"],
    })
  }
  return null
}

/** Validate the optional tariff period uuid is active. */
async function validateTariffPeriodRef(
  tx: Tx,
  tariffPeriodId: string | null,
): Promise<ActionErr | null> {
  if (!tariffPeriodId) return null
  const [period] = await tx
    .select({ id: tariffPeriods.id })
    .from(tariffPeriods)
    .where(
      and(
        eq(tariffPeriods.id, tariffPeriodId),
        eq(tariffPeriods.isDeleted, false),
      ),
    )
    .limit(1)
  if (!period) {
    return err("VALIDATION", "Check the highlighted fields.", {
      tariffPeriodId: ["That tariff period no longer exists"],
    })
  }
  return null
}

async function fetchRow(tx: Tx, id: string): Promise<TariffRow | null> {
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
    .where(eq(tariffs.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
}

export async function createTariff(
  input: CreateTariffInput,
): Promise<ActionResult<TariffRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createTariffSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const data = parsed.data

    if (await nameTaken(tx, data.name)) {
      return err("CONFLICT", "A tariff with that name already exists.", {
        name: ["That name is already in use"],
      })
    }
    if (await codeTaken(tx, data.code)) {
      return err("CONFLICT", "A tariff with that code already exists.", {
        code: ["That code is already in use"],
      })
    }
    const propErr = await validatePropertyRef(tx, data.propertyId)
    if (propErr) return propErr
    const periodErr = await validateTariffPeriodRef(tx, data.tariffPeriodId)
    if (periodErr) return periodErr

    const inserted = await tx
      .insert(tariffs)
      .values({ ...data, createdBy: ctx.userId })
      .returning({ id: tariffs.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new tariff.")

    await writeAudit({
      ctx,
      entityType: "tariff",
      entityId: id,
      action: "create",
      newValue: data,
    })

    return ok(row)
  })
}

export async function updateTariff(
  id: string,
  input: UpdateTariffInput,
): Promise<ActionResult<TariffRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateTariffSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const data = parsed.data

    const existing = await tx
      .select()
      .from(tariffs)
      .where(and(eq(tariffs.id, id), eq(tariffs.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff no longer exists.")
    }

    if (await nameTaken(tx, data.name, id)) {
      return err("CONFLICT", "A tariff with that name already exists.", {
        name: ["That name is already in use"],
      })
    }
    if (await codeTaken(tx, data.code, id)) {
      return err("CONFLICT", "A tariff with that code already exists.", {
        code: ["That code is already in use"],
      })
    }
    const propErr = await validatePropertyRef(tx, data.propertyId)
    if (propErr) return propErr
    const periodErr = await validateTariffPeriodRef(tx, data.tariffPeriodId)
    if (periodErr) return periodErr

    await tx
      .update(tariffs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tariffs.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That tariff no longer exists.")

    await writeAudit({
      ctx,
      entityType: "tariff",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        code: existing[0].code,
        status: existing[0].status,
        tariffBasis: existing[0].tariffBasis,
        refundable: existing[0].refundable,
        breakfastIncluded: existing[0].breakfastIncluded,
        propertyId: existing[0].propertyId,
        roomId: existing[0].roomId,
        tariffPeriodId: existing[0].tariffPeriodId,
        traffic: existing[0].traffic,
      },
      newValue: data,
    })

    return ok(row)
  })
}

export async function deleteTariff(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: tariffs.id, name: tariffs.name, code: tariffs.code })
      .from(tariffs)
      .where(and(eq(tariffs.id, id), eq(tariffs.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff no longer exists.")
    }

    await tx
      .update(tariffs)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(tariffs.id, id))

    await writeAudit({
      ctx,
      entityType: "tariff",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name, code: existing[0].code },
    })

    return ok({ id })
  })
}
