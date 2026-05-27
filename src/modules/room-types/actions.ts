"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { roomTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  type CreateRoomTypeInput,
  type UpdateRoomTypeInput,
} from "./schemas"
import type { RoomTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage room types.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: roomTypes.id })
    .from(roomTypes)
    .where(
      and(
        eq(roomTypes.isDeleted, false),
        sql`lower(${roomTypes.name}) = lower(${name})`,
        exceptId ? ne(roomTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRoomTypeRow(
  tx: Tx,
  id: string,
): Promise<RoomTypeRow | null> {
  const rows = await tx
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      defaultMaxOccupancy: roomTypes.defaultMaxOccupancy,
      createdAt: roomTypes.createdAt,
      updatedAt: roomTypes.updatedAt,
    })
    .from(roomTypes)
    .where(eq(roomTypes.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, roomCount: 0 } : null
}

export async function createRoomType(
  input: CreateRoomTypeInput,
): Promise<ActionResult<RoomTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createRoomTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, defaultMaxOccupancy } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A room type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(roomTypes)
      .values({ name, defaultMaxOccupancy, createdBy: ctx.userId })
      .returning({ id: roomTypes.id })

    const id = inserted[0]!.id
    const row = await fetchRoomTypeRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new room type.")

    await writeAudit({
      ctx,
      entityType: "room_type",
      entityId: id,
      action: "create",
      newValue: { name, defaultMaxOccupancy },
    })

    return ok(row)
  })
}

export async function updateRoomType(
  id: string,
  input: UpdateRoomTypeInput,
): Promise<ActionResult<RoomTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateRoomTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, defaultMaxOccupancy } = parsed.data

    const existing = await tx
      .select({
        id: roomTypes.id,
        name: roomTypes.name,
        defaultMaxOccupancy: roomTypes.defaultMaxOccupancy,
      })
      .from(roomTypes)
      .where(and(eq(roomTypes.id, id), eq(roomTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room type no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A room type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(roomTypes)
      .set({ name, defaultMaxOccupancy, updatedAt: new Date() })
      .where(eq(roomTypes.id, id))

    const row = await fetchRoomTypeRow(tx, id)
    if (!row) return err("NOT_FOUND", "That room type no longer exists.")

    await writeAudit({
      ctx,
      entityType: "room_type",
      entityId: id,
      action: "update",
      oldValue: {
        name: existing[0].name,
        defaultMaxOccupancy: existing[0].defaultMaxOccupancy,
      },
      newValue: { name, defaultMaxOccupancy },
    })

    return ok(row)
  })
}

/**
 * Soft delete - keeps any historical room.room_type_id references intact
 * once module 6 (rooms) lands. The in-use guard plugs in there: block if
 * any active room references the type.
 */
export async function deleteRoomType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: roomTypes.id, name: roomTypes.name })
      .from(roomTypes)
      .where(and(eq(roomTypes.id, id), eq(roomTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room type no longer exists.")
    }

    await tx
      .update(roomTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(roomTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "room_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
