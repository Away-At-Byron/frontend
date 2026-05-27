"use server"

import { and, eq, isNotNull, ne, sql } from "drizzle-orm"
import { roomRequests } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createRoomRequestSchema,
  updateRoomRequestSchema,
  type CreateRoomRequestInput,
  type UpdateRoomRequestInput,
} from "./schemas"
import type { RoomRequestRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage room requests.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: roomRequests.id })
    .from(roomRequests)
    .where(
      and(
        eq(roomRequests.isDeleted, false),
        sql`lower(${roomRequests.name}) = lower(${name})`,
        exceptId ? ne(roomRequests.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function codeTaken(
  tx: Tx,
  code: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: roomRequests.id })
    .from(roomRequests)
    .where(
      and(
        eq(roomRequests.isDeleted, false),
        isNotNull(roomRequests.code),
        sql`lower(${roomRequests.code}) = lower(${code})`,
        exceptId ? ne(roomRequests.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<RoomRequestRow | null> {
  const rows = await tx
    .select({
      id: roomRequests.id,
      name: roomRequests.name,
      code: roomRequests.code,
      createdAt: roomRequests.createdAt,
      updatedAt: roomRequests.updatedAt,
    })
    .from(roomRequests)
    .where(eq(roomRequests.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
}

export async function createRoomRequest(
  input: CreateRoomRequestInput,
): Promise<ActionResult<RoomRequestRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createRoomRequestSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, code } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A room request with that name already exists.", {
        name: ["That name is already in use"],
      })
    }
    if (code && (await codeTaken(tx, code))) {
      return err("CONFLICT", "A room request with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    const inserted = await tx
      .insert(roomRequests)
      .values({ name, code, createdBy: ctx.userId })
      .returning({ id: roomRequests.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new room request.")

    await writeAudit({
      ctx,
      entityType: "room_request",
      entityId: id,
      action: "create",
      newValue: { name, code },
    })

    return ok(row)
  })
}

export async function updateRoomRequest(
  id: string,
  input: UpdateRoomRequestInput,
): Promise<ActionResult<RoomRequestRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateRoomRequestSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name, code } = parsed.data

    const existing = await tx
      .select({
        id: roomRequests.id,
        name: roomRequests.name,
        code: roomRequests.code,
      })
      .from(roomRequests)
      .where(and(eq(roomRequests.id, id), eq(roomRequests.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room request no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A room request with that name already exists.", {
        name: ["That name is already in use"],
      })
    }
    if (code && (await codeTaken(tx, code, id))) {
      return err("CONFLICT", "A room request with that code already exists.", {
        code: ["That code is already in use"],
      })
    }

    await tx
      .update(roomRequests)
      .set({ name, code, updatedAt: new Date() })
      .where(eq(roomRequests.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That room request no longer exists.")

    await writeAudit({
      ctx,
      entityType: "room_request",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name, code: existing[0].code },
      newValue: { name, code },
    })

    return ok(row)
  })
}

export async function deleteRoomRequest(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({
        id: roomRequests.id,
        name: roomRequests.name,
        code: roomRequests.code,
      })
      .from(roomRequests)
      .where(and(eq(roomRequests.id, id), eq(roomRequests.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That room request no longer exists.")
    }

    await tx
      .update(roomRequests)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(roomRequests.id, id))

    await writeAudit({
      ctx,
      entityType: "room_request",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name, code: existing[0].code },
    })

    return ok({ id })
  })
}
