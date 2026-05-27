"use server"

import { and, count, eq, ne, sql } from "drizzle-orm"
import { contacts, guestTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createGuestTypeSchema,
  updateGuestTypeSchema,
  type CreateGuestTypeInput,
  type UpdateGuestTypeInput,
} from "./schemas"
import type { GuestTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage guest types.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: guestTypes.id })
    .from(guestTypes)
    .where(
      and(
        eq(guestTypes.isDeleted, false),
        sql`lower(${guestTypes.name}) = lower(${name})`,
        exceptId ? ne(guestTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(tx: Tx, id: string): Promise<GuestTypeRow | null> {
  const rows = await tx
    .select({
      id: guestTypes.id,
      name: guestTypes.name,
      createdAt: guestTypes.createdAt,
      updatedAt: guestTypes.updatedAt,
      contactCount: count(contacts.id),
    })
    .from(guestTypes)
    .leftJoin(contacts, eq(contacts.guestTypeId, guestTypes.id))
    .where(eq(guestTypes.id, id))
    .groupBy(guestTypes.id)
    .limit(1)
  return rows[0] ?? null
}

export async function createGuestType(
  input: CreateGuestTypeInput,
): Promise<ActionResult<GuestTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createGuestTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A guest type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(guestTypes)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: guestTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new guest type.")

    await writeAudit({
      ctx,
      entityType: "guest_type",
      entityId: id,
      action: "create",
      newValue: { name },
    })

    return ok(row)
  })
}

export async function updateGuestType(
  id: string,
  input: UpdateGuestTypeInput,
): Promise<ActionResult<GuestTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateGuestTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    const existing = await tx
      .select({ id: guestTypes.id, name: guestTypes.name })
      .from(guestTypes)
      .where(and(eq(guestTypes.id, id), eq(guestTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That guest type no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A guest type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(guestTypes)
      .set({ name, updatedAt: new Date() })
      .where(eq(guestTypes.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That guest type no longer exists.")

    await writeAudit({
      ctx,
      entityType: "guest_type",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
    })

    return ok(row)
  })
}

/** Soft delete - keeps historical FK references intact. */
export async function deleteGuestType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: guestTypes.id, name: guestTypes.name })
      .from(guestTypes)
      .where(and(eq(guestTypes.id, id), eq(guestTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That guest type no longer exists.")
    }

    await tx
      .update(guestTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(guestTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "guest_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
