"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { costCategories, costTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createCostTypeSchema,
  updateCostTypeSchema,
  type CreateCostTypeInput,
  type UpdateCostTypeInput,
} from "./schemas"
import type { CostTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage cost types.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  costCategoryId: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: costTypes.id })
    .from(costTypes)
    .where(
      and(
        eq(costTypes.isDeleted, false),
        eq(costTypes.costCategoryId, costCategoryId),
        sql`lower(${costTypes.name}) = lower(${name})`,
        exceptId ? ne(costTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function validateCostCategory(
  tx: Tx,
  costCategoryId: string,
): Promise<ActionErr | null> {
  const [row] = await tx
    .select({ id: costCategories.id })
    .from(costCategories)
    .where(
      and(
        eq(costCategories.id, costCategoryId),
        eq(costCategories.isDeleted, false),
      ),
    )
    .limit(1)
  if (!row) {
    return err("VALIDATION", "Check the highlighted fields.", {
      costCategoryId: ["That cost category no longer exists"],
    })
  }
  return null
}

/**
 * Decimal user value -> storage int. Cents for non-percentage bases; basis
 * points 0..10000 for percentage. Both happen to be `value * 100` rounded.
 */
function toStorageInt(value: number): number {
  return Math.round(value * 100)
}

async function fetchRow(tx: Tx, id: string): Promise<CostTypeRow | null> {
  const rows = await tx
    .select({
      id: costTypes.id,
      name: costTypes.name,
      costCategoryId: costTypes.costCategoryId,
      costCategoryName: costCategories.name,
      basis: costTypes.basis,
      defaultValueInt: costTypes.defaultValueInt,
      canBeOverridden: costTypes.canBeOverridden,
      isActive: costTypes.isActive,
      createdAt: costTypes.createdAt,
      updatedAt: costTypes.updatedAt,
    })
    .from(costTypes)
    .innerJoin(
      costCategories,
      eq(costCategories.id, costTypes.costCategoryId),
    )
    .where(eq(costTypes.id, id))
    .limit(1)
  return rows[0] ?? null
}

function toStorage(
  data:
    | ReturnType<typeof createCostTypeSchema.parse>
    | ReturnType<typeof updateCostTypeSchema.parse>,
) {
  return {
    name: data.name,
    costCategoryId: data.costCategoryId,
    basis: data.basis,
    defaultValueInt: toStorageInt(data.defaultValue),
    canBeOverridden: data.canBeOverridden,
    isActive: data.isActive,
  }
}

export async function createCostType(
  input: CreateCostTypeInput,
): Promise<ActionResult<CostTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createCostTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const refErr = await validateCostCategory(tx, parsed.data.costCategoryId)
    if (refErr) return refErr

    if (await nameTaken(tx, parsed.data.name, parsed.data.costCategoryId)) {
      return err(
        "CONFLICT",
        "A cost type with that name already exists in this category.",
        { name: ["That name is already in use for this category"] },
      )
    }

    const values = toStorage(parsed.data)
    const inserted = await tx
      .insert(costTypes)
      .values({ ...values, createdBy: ctx.userId })
      .returning({ id: costTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new cost type.")

    await writeAudit({
      ctx,
      entityType: "cost_type",
      entityId: id,
      action: "create",
      newValue: values,
    })

    return ok(row)
  })
}

export async function updateCostType(
  id: string,
  input: UpdateCostTypeInput,
): Promise<ActionResult<CostTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateCostTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(costTypes)
      .where(and(eq(costTypes.id, id), eq(costTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost type no longer exists.")
    }

    const refErr = await validateCostCategory(tx, parsed.data.costCategoryId)
    if (refErr) return refErr

    if (
      await nameTaken(tx, parsed.data.name, parsed.data.costCategoryId, id)
    ) {
      return err(
        "CONFLICT",
        "A cost type with that name already exists in this category.",
        { name: ["That name is already in use for this category"] },
      )
    }

    const values = toStorage(parsed.data)
    await tx
      .update(costTypes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(costTypes.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That cost type no longer exists.")

    await writeAudit({
      ctx,
      entityType: "cost_type",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        costCategoryId: existing[0].costCategoryId,
        basis: existing[0].basis,
        defaultValueInt: existing[0].defaultValueInt,
        canBeOverridden: existing[0].canBeOverridden,
        isActive: existing[0].isActive,
      },
      newValue: values,
    })

    return ok(row)
  })
}

export async function deleteCostType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: costTypes.id, name: costTypes.name })
      .from(costTypes)
      .where(and(eq(costTypes.id, id), eq(costTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost type no longer exists.")
    }

    await tx
      .update(costTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(costTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "cost_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
