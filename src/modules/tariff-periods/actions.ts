"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { tariffPeriods } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createTariffPeriodSchema,
  updateTariffPeriodSchema,
  type CreateTariffPeriodInput,
  type UpdateTariffPeriodInput,
} from "./schemas"
import type { TariffPeriodRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

/** Tariff periods are an admin-only Settings catalogue. */
function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage tariff periods.")
  }
  return null
}

/**
 * True when another active tariff period already uses `code`
 * (case-insensitive). `exceptId` skips the row being updated.
 */
async function codeTaken(
  tx: Tx,
  code: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: tariffPeriods.id })
    .from(tariffPeriods)
    .where(
      and(
        eq(tariffPeriods.isDeleted, false),
        sql`lower(${tariffPeriods.code}) = lower(${code})`,
        exceptId ? ne(tariffPeriods.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchTariffPeriodRow(
  tx: Tx,
  id: string,
): Promise<TariffPeriodRow | null> {
  const rows = await tx
    .select({
      id: tariffPeriods.id,
      code: tariffPeriods.code,
      description: tariffPeriods.description,
      fromDate: tariffPeriods.fromDate,
      toDate: tariffPeriods.toDate,
      createdAt: tariffPeriods.createdAt,
      updatedAt: tariffPeriods.updatedAt,
    })
    .from(tariffPeriods)
    .where(eq(tariffPeriods.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createTariffPeriod(
  input: CreateTariffPeriodInput,
): Promise<ActionResult<TariffPeriodRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createTariffPeriodSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { code, description, fromDate, toDate } = parsed.data

    if (await codeTaken(tx, code)) {
      return err("CONFLICT", "A tariff period with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    const inserted = await tx
      .insert(tariffPeriods)
      .values({
        code,
        description,
        fromDate,
        toDate,
        createdBy: ctx.userId,
      })
      .returning({ id: tariffPeriods.id })

    const id = inserted[0]!.id
    const row = await fetchTariffPeriodRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new tariff period.")

    await writeAudit({
      ctx,
      entityType: "tariff_period",
      entityId: id,
      action: "create",
      newValue: { code, description, fromDate, toDate },
    })

    return ok(row)
  })
}

export async function updateTariffPeriod(
  id: string,
  input: UpdateTariffPeriodInput,
): Promise<ActionResult<TariffPeriodRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateTariffPeriodSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { code, description, fromDate, toDate } = parsed.data

    const existing = await tx
      .select({
        id: tariffPeriods.id,
        code: tariffPeriods.code,
        description: tariffPeriods.description,
        fromDate: tariffPeriods.fromDate,
        toDate: tariffPeriods.toDate,
      })
      .from(tariffPeriods)
      .where(and(eq(tariffPeriods.id, id), eq(tariffPeriods.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff period no longer exists.")
    }

    if (await codeTaken(tx, code, id)) {
      return err("CONFLICT", "A tariff period with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    await tx
      .update(tariffPeriods)
      .set({ code, description, fromDate, toDate, updatedAt: new Date() })
      .where(eq(tariffPeriods.id, id))

    const row = await fetchTariffPeriodRow(tx, id)
    if (!row) return err("NOT_FOUND", "That tariff period no longer exists.")

    await writeAudit({
      ctx,
      entityType: "tariff_period",
      entityId: id,
      action: "update",
      oldValue: existing[0],
      newValue: { code, description, fromDate, toDate },
    })

    return ok(row)
  })
}

/** Soft delete — flips `is_deleted` so historical references stay intact. */
export async function deleteTariffPeriod(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: tariffPeriods.id, code: tariffPeriods.code })
      .from(tariffPeriods)
      .where(and(eq(tariffPeriods.id, id), eq(tariffPeriods.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff period no longer exists.")
    }

    await tx
      .update(tariffPeriods)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(tariffPeriods.id, id))

    await writeAudit({
      ctx,
      entityType: "tariff_period",
      entityId: id,
      action: "delete",
      oldValue: { code: existing[0].code },
    })

    return ok({ id })
  })
}
