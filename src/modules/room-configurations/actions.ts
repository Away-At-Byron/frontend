"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { roomConfigurations } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createRoomConfigurationSchema,
  updateRoomConfigurationSchema,
  type CreateRoomConfigurationInput,
  type UpdateRoomConfigurationInput,
} from "./schemas"
import type { RoomConfigurationRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage room configurations.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: roomConfigurations.id })
    .from(roomConfigurations)
    .where(
      and(
        eq(roomConfigurations.isDeleted, false),
        sql`lower(${roomConfigurations.name}) = lower(${name})`,
        exceptId ? ne(roomConfigurations.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<RoomConfigurationRow | null> {
  const rows = await tx
    .select({
      id: roomConfigurations.id,
      name: roomConfigurations.name,
      defaultMaxOccupancy: roomConfigurations.defaultMaxOccupancy,
      createdAt: roomConfigurations.createdAt,
      updatedAt: roomConfigurations.updatedAt,
    })
    .from(roomConfigurations)
    .where(eq(roomConfigurations.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, roomCount: 0 } : null
}

export async function createRoomConfiguration(
  input: CreateRoomConfigurationInput,
): Promise<ActionResult<RoomConfigurationRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createRoomConfigurationSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, defaultMaxOccupancy } = parsed.data

    if (await nameTaken(tx, name)) {
      return err(
        "CONFLICT",
        "A room configuration with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    const inserted = await tx
      .insert(roomConfigurations)
      .values({ name, defaultMaxOccupancy, createdBy: ctx.userId })
      .returning({ id: roomConfigurations.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new room configuration.")

    await writeAudit({
      ctx,
      entityType: "room_configuration",
      entityId: id,
      action: "create",
      newValue: { name, defaultMaxOccupancy },
    })

    return ok(row)
  })
}

export async function updateRoomConfiguration(
  id: string,
  input: UpdateRoomConfigurationInput,
): Promise<ActionResult<RoomConfigurationRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateRoomConfigurationSchema.safeParse(input)
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
        id: roomConfigurations.id,
        name: roomConfigurations.name,
        defaultMaxOccupancy: roomConfigurations.defaultMaxOccupancy,
      })
      .from(roomConfigurations)
      .where(
        and(eq(roomConfigurations.id, id), eq(roomConfigurations.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room configuration no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err(
        "CONFLICT",
        "A room configuration with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    await tx
      .update(roomConfigurations)
      .set({ name, defaultMaxOccupancy, updatedAt: new Date() })
      .where(eq(roomConfigurations.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That room configuration no longer exists.")

    await writeAudit({
      ctx,
      entityType: "room_configuration",
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
 * Soft delete - keeps any historical room.room_configuration_id references
 * intact once module 6 (rooms) lands. The in-use guard plugs in there.
 */
export async function deleteRoomConfiguration(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: roomConfigurations.id, name: roomConfigurations.name })
      .from(roomConfigurations)
      .where(
        and(eq(roomConfigurations.id, id), eq(roomConfigurations.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room configuration no longer exists.")
    }

    await tx
      .update(roomConfigurations)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(roomConfigurations.id, id))

    await writeAudit({
      ctx,
      entityType: "room_configuration",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
