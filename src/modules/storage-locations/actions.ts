"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { storageLocations } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionErr, type ActionResult } from "@/lib/result"
import {
  createStorageLocationSchema,
  updateStorageLocationSchema,
  type CreateStorageLocationInput,
  type UpdateStorageLocationInput,
} from "./schemas"
import type { StorageLocationRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage storage locations.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: storageLocations.id })
    .from(storageLocations)
    .where(
      and(
        eq(storageLocations.isDeleted, false),
        sql`lower(${storageLocations.name}) = lower(${name})`,
        exceptId ? ne(storageLocations.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<StorageLocationRow | null> {
  const rows = await tx
    .select({
      id: storageLocations.id,
      name: storageLocations.name,
      createdAt: storageLocations.createdAt,
      updatedAt: storageLocations.updatedAt,
    })
    .from(storageLocations)
    .where(eq(storageLocations.id, id))
    .limit(1)
  if (!rows[0]) return null
  return { ...rows[0], itemCount: 0 }
}

export async function createStorageLocation(
  input: CreateStorageLocationInput,
): Promise<ActionResult<StorageLocationRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createStorageLocationSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    if (await nameTaken(tx, parsed.data.name)) {
      return err(
        "CONFLICT",
        "A storage location with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    const inserted = await tx
      .insert(storageLocations)
      .values({ name: parsed.data.name, createdBy: ctx.userId })
      .returning({ id: storageLocations.id })

    const id = inserted[0]!.id
    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new storage location.")

    await writeAudit({
      ctx,
      entityType: "storage_location",
      entityId: id,
      action: "create",
      newValue: { name: row.name },
    })

    return ok(row)
  })
}

export async function updateStorageLocation(
  id: string,
  input: UpdateStorageLocationInput,
): Promise<ActionResult<StorageLocationRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateStorageLocationSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(storageLocations)
      .where(
        and(
          eq(storageLocations.id, id),
          eq(storageLocations.isDeleted, false),
        ),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That storage location no longer exists.")
    }

    if (await nameTaken(tx, parsed.data.name, id)) {
      return err(
        "CONFLICT",
        "A storage location with that name already exists.",
        { name: ["That name is already in use"] },
      )
    }

    await tx
      .update(storageLocations)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(storageLocations.id, id))

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That storage location no longer exists.")

    await writeAudit({
      ctx,
      entityType: "storage_location",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name: parsed.data.name },
    })

    return ok(row)
  })
}

export async function deleteStorageLocation(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: storageLocations.id, name: storageLocations.name })
      .from(storageLocations)
      .where(
        and(
          eq(storageLocations.id, id),
          eq(storageLocations.isDeleted, false),
        ),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That storage location no longer exists.")
    }

    await tx
      .update(storageLocations)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(storageLocations.id, id))

    await writeAudit({
      ctx,
      entityType: "storage_location",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
