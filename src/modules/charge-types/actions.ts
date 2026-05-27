"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { chargeTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createChargeTypeSchema,
  updateChargeTypeSchema,
  type CreateChargeTypeInput,
  type UpdateChargeTypeInput,
} from "./schemas"
import type { ChargeTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage booking charges.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: chargeTypes.id })
    .from(chargeTypes)
    .where(
      and(
        eq(chargeTypes.isDeleted, false),
        sql`lower(${chargeTypes.name}) = lower(${name})`,
        exceptId ? ne(chargeTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/** Convert decimal dollars (e.g. 1500.5) to integer cents (150050). */
function dollarsToCents(value: number): number {
  return Math.round(value * 100)
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<ChargeTypeRow | null> {
  const rows = await tx
    .select({
      id: chargeTypes.id,
      name: chargeTypes.name,
      defaultAmountCents: chargeTypes.defaultAmountCents,
      createdAt: chargeTypes.createdAt,
      updatedAt: chargeTypes.updatedAt,
    })
    .from(chargeTypes)
    .where(eq(chargeTypes.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
}

export async function createChargeType(
  input: CreateChargeTypeInput,
): Promise<ActionResult<ChargeTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createChargeTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, amount } = parsed.data
    const cents = dollarsToCents(amount)

    if (await nameTaken(tx, name)) {
      return err(
        "CONFLICT",
        "A booking charge with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    const inserted = await tx
      .insert(chargeTypes)
      .values({
        name,
        defaultAmountCents: cents,
        createdBy: ctx.userId,
      })
      .returning({ id: chargeTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new booking charge.")

    await writeAudit({
      ctx,
      entityType: "charge_type",
      entityId: id,
      action: "create",
      newValue: { name, defaultAmountCents: cents },
    })

    return ok(row)
  })
}

export async function updateChargeType(
  id: string,
  input: UpdateChargeTypeInput,
): Promise<ActionResult<ChargeTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateChargeTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, amount } = parsed.data
    const cents = dollarsToCents(amount)

    const existing = await tx
      .select({
        id: chargeTypes.id,
        name: chargeTypes.name,
        defaultAmountCents: chargeTypes.defaultAmountCents,
      })
      .from(chargeTypes)
      .where(and(eq(chargeTypes.id, id), eq(chargeTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That booking charge no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err(
        "CONFLICT",
        "A booking charge with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    await tx
      .update(chargeTypes)
      .set({ name, defaultAmountCents: cents, updatedAt: new Date() })
      .where(eq(chargeTypes.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That booking charge no longer exists.")

    await writeAudit({
      ctx,
      entityType: "charge_type",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        defaultAmountCents: existing[0].defaultAmountCents,
      },
      newValue: { name, defaultAmountCents: cents },
    })

    return ok(row)
  })
}

export async function deleteChargeType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: chargeTypes.id, name: chargeTypes.name })
      .from(chargeTypes)
      .where(and(eq(chargeTypes.id, id), eq(chargeTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That booking charge no longer exists.")
    }

    await tx
      .update(chargeTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(chargeTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "charge_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
