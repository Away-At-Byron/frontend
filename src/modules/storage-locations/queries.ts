import "server-only"

import { asc, eq, sql } from "drizzle-orm"
import {
  inventoryItemStorageAssignments,
  storageLocations,
} from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type {
  StorageLocationOption,
  StorageLocationRow,
} from "./types"

export type {
  StorageLocationOption,
  StorageLocationRow,
} from "./types"

/** Every active storage location with the number of items assigned to it. */
export async function listStorageLocations(): Promise<
  ActionResult<StorageLocationRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage storage locations.")
    }
    const rows = await tx
      .select({
        id: storageLocations.id,
        name: storageLocations.name,
        itemCount: sql<number>`count(${inventoryItemStorageAssignments.id})::int`,
        createdAt: storageLocations.createdAt,
        updatedAt: storageLocations.updatedAt,
      })
      .from(storageLocations)
      .leftJoin(
        inventoryItemStorageAssignments,
        eq(
          inventoryItemStorageAssignments.storageLocationId,
          storageLocations.id,
        ),
      )
      .where(eq(storageLocations.isDeleted, false))
      .groupBy(storageLocations.id)
      .orderBy(asc(storageLocations.name))

    return ok(rows)
  })
}

/** Lightweight options list for the storage picker on the inventory form. */
export async function listStorageLocationOptions(): Promise<
  ActionResult<StorageLocationOption[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage storage locations.")
    }
    const rows = await tx
      .select({ id: storageLocations.id, name: storageLocations.name })
      .from(storageLocations)
      .where(eq(storageLocations.isDeleted, false))
      .orderBy(asc(storageLocations.name))
    return ok(rows)
  })
}
