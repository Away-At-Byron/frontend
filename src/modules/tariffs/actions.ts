"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { tariffs } from "@/db/schema"
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

async function fetchRow(tx: Tx, id: string): Promise<TariffRow | null> {
  const rows = await tx
    .select({
      id: tariffs.id,
      name: tariffs.name,
      createdAt: tariffs.createdAt,
      updatedAt: tariffs.updatedAt,
    })
    .from(tariffs)
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
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A tariff with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(tariffs)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: tariffs.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new tariff.")

    await writeAudit({
      ctx,
      entityType: "tariff",
      entityId: id,
      action: "create",
      newValue: { name },
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
    const { name } = parsed.data

    const existing = await tx
      .select({ id: tariffs.id, name: tariffs.name })
      .from(tariffs)
      .where(and(eq(tariffs.id, id), eq(tariffs.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That tariff no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A tariff with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(tariffs)
      .set({ name, updatedAt: new Date() })
      .where(eq(tariffs.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That tariff no longer exists.")

    await writeAudit({
      ctx,
      entityType: "tariff",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
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
      .select({ id: tariffs.id, name: tariffs.name })
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
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
