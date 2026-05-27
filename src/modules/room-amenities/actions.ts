"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { roomAmenities } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createRoomAmenitySchema,
  updateRoomAmenitySchema,
  type CreateRoomAmenityInput,
  type UpdateRoomAmenityInput,
} from "./schemas"
import type { RoomAmenityRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage room amenities.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: roomAmenities.id })
    .from(roomAmenities)
    .where(
      and(
        eq(roomAmenities.isDeleted, false),
        sql`lower(${roomAmenities.name}) = lower(${name})`,
        exceptId ? ne(roomAmenities.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<RoomAmenityRow | null> {
  const rows = await tx
    .select({
      id: roomAmenities.id,
      name: roomAmenities.name,
      createdAt: roomAmenities.createdAt,
      updatedAt: roomAmenities.updatedAt,
    })
    .from(roomAmenities)
    .where(eq(roomAmenities.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
}

export async function createRoomAmenity(
  input: CreateRoomAmenityInput,
): Promise<ActionResult<RoomAmenityRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createRoomAmenitySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A room amenity with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(roomAmenities)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: roomAmenities.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new room amenity.")

    await writeAudit({
      ctx,
      entityType: "room_amenity",
      entityId: id,
      action: "create",
      newValue: { name },
    })

    return ok(row)
  })
}

export async function updateRoomAmenity(
  id: string,
  input: UpdateRoomAmenityInput,
): Promise<ActionResult<RoomAmenityRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateRoomAmenitySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    const existing = await tx
      .select({ id: roomAmenities.id, name: roomAmenities.name })
      .from(roomAmenities)
      .where(and(eq(roomAmenities.id, id), eq(roomAmenities.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room amenity no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A room amenity with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(roomAmenities)
      .set({ name, updatedAt: new Date() })
      .where(eq(roomAmenities.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That room amenity no longer exists.")

    await writeAudit({
      ctx,
      entityType: "room_amenity",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
    })

    return ok(row)
  })
}

export async function deleteRoomAmenity(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: roomAmenities.id, name: roomAmenities.name })
      .from(roomAmenities)
      .where(and(eq(roomAmenities.id, id), eq(roomAmenities.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room amenity no longer exists.")
    }

    await tx
      .update(roomAmenities)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(roomAmenities.id, id))

    await writeAudit({
      ctx,
      entityType: "room_amenity",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
