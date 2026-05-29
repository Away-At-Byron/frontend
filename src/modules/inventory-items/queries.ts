import "server-only"

import { and, asc, eq, sql } from "drizzle-orm"
import { presignDownload } from "@/lib/storage"
import {
  contacts,
  contactTypes,
  inventoryItemStorageAssignments,
  inventoryItems,
  storageLocations,
} from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type {
  InventoryItemRow,
  StorageAllocation,
  SupplierOption,
} from "./types"

export type {
  InventoryItemRow,
  StorageAllocation,
  SupplierOption,
} from "./types"

const ITEM_SELECTION = {
  id: inventoryItems.id,
  name: inventoryItems.name,
  type: inventoryItems.type,
  category: inventoryItems.category,
  status: inventoryItems.status,
  description: inventoryItems.description,
  photoKey: inventoryItems.photoKey,
  quantityOnHand: inventoryItems.quantityOnHand,
  warrantyExpiry: inventoryItems.warrantyExpiry,
  expectedUsefulLife: inventoryItems.expectedUsefulLife,
  minimumThreshold: inventoryItems.minimumThreshold,
  replacementCostCents: inventoryItems.replacementCostCents,
  reorderLevel: inventoryItems.reorderLevel,
  unitCostCents: inventoryItems.unitCostCents,
  supplierContactId: inventoryItems.supplierContactId,
  supplierName: sql<string | null>`(
    ${contacts.firstName} || ' ' || ${contacts.lastName}
  )`,
  lastRestockedDate: inventoryItems.lastRestockedDate,
  minimumReorderQty: inventoryItems.minimumReorderQty,
  createdAt: inventoryItems.createdAt,
  updatedAt: inventoryItems.updatedAt,
} as const

/** Every active inventory item with its supplier name resolved. */
export async function listInventoryItems(): Promise<
  ActionResult<InventoryItemRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage inventory.")
    }
    const rows = await tx
      .select(ITEM_SELECTION)
      .from(inventoryItems)
      .leftJoin(contacts, eq(contacts.id, inventoryItems.supplierContactId))
      .where(eq(inventoryItems.isDeleted, false))
      .orderBy(asc(inventoryItems.type), asc(inventoryItems.name))

    return ok(rows)
  })
}

/** Single item + signed photo URL + current storage allocations. */
export async function getInventoryItem(id: string): Promise<
  ActionResult<{
    item: InventoryItemRow
    photoUrl: string | null
    storageAllocations: StorageAllocation[]
  }>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage inventory.")
    }
    const rows = await tx
      .select(ITEM_SELECTION)
      .from(inventoryItems)
      .leftJoin(contacts, eq(contacts.id, inventoryItems.supplierContactId))
      .where(
        and(eq(inventoryItems.id, id), eq(inventoryItems.isDeleted, false)),
      )
      .limit(1)
    const item = rows[0]
    if (!item) return err("NOT_FOUND", "That item no longer exists.")

    const allocations = await tx
      .select({
        storageLocationId: inventoryItemStorageAssignments.storageLocationId,
        storageLocationName: storageLocations.name,
        qty: inventoryItemStorageAssignments.qty,
      })
      .from(inventoryItemStorageAssignments)
      .innerJoin(
        storageLocations,
        eq(
          storageLocations.id,
          inventoryItemStorageAssignments.storageLocationId,
        ),
      )
      .where(eq(inventoryItemStorageAssignments.inventoryItemId, id))
      .orderBy(asc(storageLocations.name))

    const photoUrl = item.photoKey
      ? await presignDownload(item.photoKey)
      : null
    return ok({ item, photoUrl, storageAllocations: allocations })
  })
}

/** Suppliers (contacts whose contact_type is "Supplier"). */
export async function listSupplierOptions(): Promise<
  ActionResult<SupplierOption[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage inventory.")
    }
    const rows = await tx
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
      })
      .from(contacts)
      .innerJoin(contactTypes, eq(contactTypes.id, contacts.contactTypeId))
      .where(
        and(
          eq(contacts.isDeleted, false),
          eq(contactTypes.isDeleted, false),
          sql`lower(${contactTypes.name}) = 'supplier'`,
        ),
      )
      .orderBy(asc(contacts.firstName), asc(contacts.lastName))

    return ok(
      rows.map((r) => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`.trim(),
      })),
    )
  })
}
