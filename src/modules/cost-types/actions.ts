"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { costTypes } from "@/db/schema"
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
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: costTypes.id })
    .from(costTypes)
    .where(
      and(
        eq(costTypes.isDeleted, false),
        sql`lower(${costTypes.name}) = lower(${name})`,
        exceptId ? ne(costTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100)
}

async function fetchRow(tx: Tx, id: string): Promise<CostTypeRow | null> {
  const rows = await tx
    .select({
      id: costTypes.id,
      name: costTypes.name,
      defaultRateCents: costTypes.defaultRateCents,
      canOverridden: costTypes.canOverridden,
      isDeduction: costTypes.isDeduction,
      isAddition: costTypes.isAddition,
      createdAt: costTypes.createdAt,
      updatedAt: costTypes.updatedAt,
    })
    .from(costTypes)
    .where(eq(costTypes.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
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
    const { name, defaultRate, canOverridden, isDeduction, isAddition } =
      parsed.data
    const cents = dollarsToCents(defaultRate)

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A cost type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(costTypes)
      .values({
        name,
        defaultRateCents: cents,
        canOverridden,
        isDeduction,
        isAddition,
        createdBy: ctx.userId,
      })
      .returning({ id: costTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new cost type.")

    await writeAudit({
      ctx,
      entityType: "cost_type",
      entityId: id,
      action: "create",
      newValue: {
        name,
        defaultRateCents: cents,
        canOverridden,
        isDeduction,
        isAddition,
      },
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
    const { name, defaultRate, canOverridden, isDeduction, isAddition } =
      parsed.data
    const cents = dollarsToCents(defaultRate)

    const existing = await tx
      .select()
      .from(costTypes)
      .where(and(eq(costTypes.id, id), eq(costTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That cost type no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A cost type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(costTypes)
      .set({
        name,
        defaultRateCents: cents,
        canOverridden,
        isDeduction,
        isAddition,
        updatedAt: new Date(),
      })
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
        defaultRateCents: existing[0].defaultRateCents,
        canOverridden: existing[0].canOverridden,
        isDeduction: existing[0].isDeduction,
        isAddition: existing[0].isAddition,
      },
      newValue: {
        name,
        defaultRateCents: cents,
        canOverridden,
        isDeduction,
        isAddition,
      },
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
