"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { costCategories, costTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createCostCategorySchema,
  updateCostCategorySchema,
  type CreateCostCategoryInput,
  type UpdateCostCategoryInput,
} from "./schemas"
import type { CostCategoryRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage cost categories.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  costTypeId: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: costCategories.id })
    .from(costCategories)
    .where(
      and(
        eq(costCategories.isDeleted, false),
        eq(costCategories.costTypeId, costTypeId),
        sql`lower(${costCategories.name}) = lower(${name})`,
        exceptId ? ne(costCategories.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function validateCostType(
  tx: Tx,
  costTypeId: string,
): Promise<ActionErr | null> {
  const [row] = await tx
    .select({ id: costTypes.id })
    .from(costTypes)
    .where(and(eq(costTypes.id, costTypeId), eq(costTypes.isDeleted, false)))
    .limit(1)
  if (!row) {
    return err("VALIDATION", "Check the highlighted fields.", {
      costTypeId: ["That cost type no longer exists"],
    })
  }
  return null
}

function toIntScaled(value: number): number {
  return Math.round(value * 100)
}

async function fetchRow(tx: Tx, id: string): Promise<CostCategoryRow | null> {
  const rows = await tx
    .select({
      id: costCategories.id,
      name: costCategories.name,
      costTypeId: costCategories.costTypeId,
      costTypeName: costTypes.name,
      costTypeDefaultRateCents: costTypes.defaultRateCents,
      basis: costCategories.basis,
      amountInt: costCategories.amountInt,
      isOverridden: costCategories.isOverridden,
      isActive: costCategories.isActive,
      createdAt: costCategories.createdAt,
      updatedAt: costCategories.updatedAt,
    })
    .from(costCategories)
    .innerJoin(costTypes, eq(costTypes.id, costCategories.costTypeId))
    .where(eq(costCategories.id, id))
    .limit(1)
  return rows[0] ?? null
}

function toStorage(
  data:
    | ReturnType<typeof createCostCategorySchema.parse>
    | ReturnType<typeof updateCostCategorySchema.parse>,
) {
  // When the category does not override, the typed amount is ignored - we
  // store 0 so the column stays clean and the apply-time formula
  // (isOverridden ? amountInt : costType.default_rate_cents) is unambiguous.
  return {
    name: data.name,
    costTypeId: data.costTypeId,
    basis: data.basis,
    amountInt: data.isOverridden ? toIntScaled(data.amount) : 0,
    isOverridden: data.isOverridden,
    isActive: data.isActive,
  }
}

export async function createCostCategory(
  input: CreateCostCategoryInput,
): Promise<ActionResult<CostCategoryRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createCostCategorySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const refErr = await validateCostType(tx, parsed.data.costTypeId)
    if (refErr) return refErr

    if (await nameTaken(tx, parsed.data.name, parsed.data.costTypeId)) {
      return err(
        "CONFLICT",
        "A category with that name already exists for this cost type.",
        { name: ["That name is already in use for this cost type"] },
      )
    }

    const values = toStorage(parsed.data)
    const inserted = await tx
      .insert(costCategories)
      .values({ ...values, createdBy: ctx.userId })
      .returning({ id: costCategories.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new cost category.")

    await writeAudit({
      ctx,
      entityType: "cost_category",
      entityId: id,
      action: "create",
      newValue: values,
    })

    return ok(row)
  })
}

export async function updateCostCategory(
  id: string,
  input: UpdateCostCategoryInput,
): Promise<ActionResult<CostCategoryRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateCostCategorySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(costCategories)
      .where(and(eq(costCategories.id, id), eq(costCategories.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost category no longer exists.")
    }

    const refErr = await validateCostType(tx, parsed.data.costTypeId)
    if (refErr) return refErr

    if (
      await nameTaken(tx, parsed.data.name, parsed.data.costTypeId, id)
    ) {
      return err(
        "CONFLICT",
        "A category with that name already exists for this cost type.",
        { name: ["That name is already in use for this cost type"] },
      )
    }

    const values = toStorage(parsed.data)
    await tx
      .update(costCategories)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(costCategories.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That cost category no longer exists.")

    await writeAudit({
      ctx,
      entityType: "cost_category",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        costTypeId: existing[0].costTypeId,
        basis: existing[0].basis,
        amountInt: existing[0].amountInt,
      },
      newValue: values,
    })

    return ok(row)
  })
}

export async function deleteCostCategory(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: costCategories.id, name: costCategories.name })
      .from(costCategories)
      .where(and(eq(costCategories.id, id), eq(costCategories.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost category no longer exists.")
    }

    await tx
      .update(costCategories)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(costCategories.id, id))

    await writeAudit({
      ctx,
      entityType: "cost_category",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
