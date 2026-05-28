"use server"

import { and, count, eq, ne, sql } from "drizzle-orm"
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
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: costCategories.id })
    .from(costCategories)
    .where(
      and(
        eq(costCategories.isDeleted, false),
        sql`lower(${costCategories.name}) = lower(${name})`,
        exceptId ? ne(costCategories.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(tx: Tx, id: string): Promise<CostCategoryRow | null> {
  const rows = await tx
    .select({
      id: costCategories.id,
      name: costCategories.name,
      createdAt: costCategories.createdAt,
      updatedAt: costCategories.updatedAt,
      costTypeCount: count(costTypes.id),
    })
    .from(costCategories)
    .leftJoin(
      costTypes,
      and(
        eq(costTypes.costCategoryId, costCategories.id),
        eq(costTypes.isDeleted, false),
      ),
    )
    .where(eq(costCategories.id, id))
    .groupBy(costCategories.id)
    .limit(1)
  return rows[0] ?? null
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
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A cost category with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(costCategories)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: costCategories.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new cost category.")

    await writeAudit({
      ctx,
      entityType: "cost_category",
      entityId: id,
      action: "create",
      newValue: { name },
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
    const { name } = parsed.data

    const existing = await tx
      .select({ id: costCategories.id, name: costCategories.name })
      .from(costCategories)
      .where(and(eq(costCategories.id, id), eq(costCategories.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost category no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A cost category with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(costCategories)
      .set({ name, updatedAt: new Date() })
      .where(eq(costCategories.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That cost category no longer exists.")

    await writeAudit({
      ctx,
      entityType: "cost_category",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
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

    // Block delete while active cost types still depend on this category;
    // the DB FK is ON DELETE RESTRICT but soft-delete bypasses that.
    const [dependants] = await tx
      .select({ n: count(costTypes.id) })
      .from(costTypes)
      .where(
        and(
          eq(costTypes.costCategoryId, id),
          eq(costTypes.isDeleted, false),
        ),
      )
    if ((dependants?.n ?? 0) > 0) {
      return err(
        "CONFLICT",
        "Remove or reassign the cost types in this category first.",
      )
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
