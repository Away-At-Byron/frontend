"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { discountTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createDiscountTypeSchema,
  updateDiscountTypeSchema,
  type CreateDiscountTypeInput,
  type UpdateDiscountTypeInput,
} from "./schemas"
import { computeStatus } from "./status"
import type { DiscountTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage discount types.")
  }
  return null
}

async function codeTaken(
  tx: Tx,
  code: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: discountTypes.id })
    .from(discountTypes)
    .where(
      and(
        eq(discountTypes.isDeleted, false),
        sql`lower(${discountTypes.code}) = lower(${code})`,
        exceptId ? ne(discountTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/** Convert a decimal (e.g. 25, 50.5) to its integer storage form. */
function toIntScaled(value: number): number {
  return Math.round(value * 100)
}

/** Map a validated form input to the row shape stored in Postgres. */
function toStorage(
  data:
    | ReturnType<typeof createDiscountTypeSchema.parse>
    | ReturnType<typeof updateDiscountTypeSchema.parse>,
) {
  return {
    name: data.name,
    code: data.code,
    description: data.description,
    type: data.type,
    valueInt: toIntScaled(data.value),
    maxDiscountCents:
      data.maxDiscount === null || data.type !== "percentage"
        ? null
        : toIntScaled(data.maxDiscount),
    durationStart: data.durationStart,
    durationEnd: data.durationEnd,
    activationMode: data.activationMode,
    minAmountCents:
      data.minAmount === null ? null : toIntScaled(data.minAmount),
    minNights: data.minNights ?? null,
    stackable: data.stackable,
  }
}

async function fetchRow(tx: Tx, id: string): Promise<DiscountTypeRow | null> {
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
    .where(eq(discountTypes.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, status: computeStatus(r) } : null
}

export async function createDiscountType(
  input: CreateDiscountTypeInput,
): Promise<ActionResult<DiscountTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createDiscountTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    if (await codeTaken(tx, parsed.data.code)) {
      return err("CONFLICT", "A discount with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    const values = toStorage(parsed.data)
    const inserted = await tx
      .insert(discountTypes)
      .values({ ...values, createdBy: ctx.userId })
      .returning({ id: discountTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new discount.")

    await writeAudit({
      ctx,
      entityType: "discount_type",
      entityId: id,
      action: "create",
      newValue: values,
    })

    return ok(row)
  })
}

export async function updateDiscountType(
  id: string,
  input: UpdateDiscountTypeInput,
): Promise<ActionResult<DiscountTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateDiscountTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(discountTypes)
      .where(and(eq(discountTypes.id, id), eq(discountTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That discount no longer exists.")
    }

    if (await codeTaken(tx, parsed.data.code, id)) {
      return err("CONFLICT", "A discount with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    const values = toStorage(parsed.data)
    await tx
      .update(discountTypes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(discountTypes.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That discount no longer exists.")

    await writeAudit({
      ctx,
      entityType: "discount_type",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        code: existing[0].code,
        type: existing[0].type,
        valueInt: existing[0].valueInt,
      },
      newValue: values,
    })

    return ok(row)
  })
}

export async function deleteDiscountType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({
        id: discountTypes.id,
        name: discountTypes.name,
        code: discountTypes.code,
      })
      .from(discountTypes)
      .where(and(eq(discountTypes.id, id), eq(discountTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That discount no longer exists.")
    }

    await tx
      .update(discountTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(discountTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "discount_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name, code: existing[0].code },
    })

    return ok({ id })
  })
}
