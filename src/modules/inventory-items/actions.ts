"use server"

import { and, eq, inArray, ne, sql } from "drizzle-orm"
import {
  contacts,
  contactTypes,
  inventoryItemStorageAssignments,
  inventoryItems,
  storageLocations,
} from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  type CreateInventoryItemInput,
  type UpdateInventoryItemInput,
} from "./schemas"
import type { InventoryItemRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]
type Parsed = ReturnType<typeof createInventoryItemSchema.parse>

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage inventory.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  type: "asset" | "inventory" | "consumable",
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: inventoryItems.id })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.isDeleted, false),
        eq(inventoryItems.type, type),
        sql`lower(${inventoryItems.name}) = lower(${name})`,
        exceptId ? ne(inventoryItems.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

async function validateSupplier(
  tx: Tx,
  supplierContactId: string | null,
): Promise<ActionErr | null> {
  if (!supplierContactId) return null
  const [row] = await tx
    .select({ id: contacts.id })
    .from(contacts)
    .innerJoin(contactTypes, eq(contactTypes.id, contacts.contactTypeId))
    .where(
      and(
        eq(contacts.id, supplierContactId),
        eq(contacts.isDeleted, false),
        eq(contactTypes.isDeleted, false),
        sql`lower(${contactTypes.name}) = 'supplier'`,
      ),
    )
    .limit(1)
  if (!row) {
    return err("VALIDATION", "Check the highlighted fields.", {
      supplierContactId: ["That supplier no longer exists"],
    })
  }
  return null
}

async function validateAllocations(
  tx: Tx,
  allocations: { storageLocationId: string }[],
): Promise<ActionErr | null> {
  if (allocations.length === 0) return null
  const ids = allocations.map((a) => a.storageLocationId)
  const found = await tx
    .select({ id: storageLocations.id })
    .from(storageLocations)
    .where(
      and(
        eq(storageLocations.isDeleted, false),
        inArray(storageLocations.id, ids),
      ),
    )
  const foundSet = new Set(found.map((r) => r.id))
  const missing = ids.find((id) => !foundSet.has(id))
  if (missing) {
    return err("VALIDATION", "Check the highlighted fields.", {
      storageAllocations: ["One of the storage locations no longer exists"],
    })
  }
  // Dedup check: same location twice in one save would violate the unique idx.
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      return err("VALIDATION", "Check the highlighted fields.", {
        storageAllocations: ["Each storage location can only appear once"],
      })
    }
    seen.add(id)
  }
  return null
}

function dollarsToCents(value: number | null): number | null {
  return value == null ? null : Math.round(value * 100)
}

function toStorage(data: Parsed) {
  return {
    name: data.name,
    type: data.type,
    category: data.category,
    status: data.status,
    description: data.description,
    photoKey: data.photoKey,
    quantityOnHand: data.quantityOnHand,

    warrantyExpiry: data.type === "asset" ? data.warrantyExpiry : null,
    expectedUsefulLife: data.type === "asset" ? data.expectedUsefulLife : null,

    minimumThreshold:
      data.type === "inventory" ? data.minimumThreshold : null,
    replacementCostCents:
      data.type === "inventory" ? dollarsToCents(data.replacementCost) : null,

    reorderLevel: data.type === "consumable" ? data.reorderLevel : null,
    unitCostCents:
      data.type === "consumable" ? dollarsToCents(data.unitCost) : null,
    supplierContactId:
      data.type === "consumable" ? data.supplierContactId : null,
    lastRestockedDate:
      data.type === "consumable" ? data.lastRestockedDate : null,

    minimumReorderQty:
      data.type === "asset" ? null : data.minimumReorderQty,
  }
}

async function syncAllocations(
  tx: Tx,
  itemId: string,
  allocations: { storageLocationId: string; qty: number }[],
): Promise<void> {
  // Wipe-and-replace is OK while the editor saves the full list each time;
  // it keeps the implementation simple and stays inside one transaction.
  await tx
    .delete(inventoryItemStorageAssignments)
    .where(eq(inventoryItemStorageAssignments.inventoryItemId, itemId))
  if (allocations.length === 0) return
  await tx.insert(inventoryItemStorageAssignments).values(
    allocations.map((a) => ({
      inventoryItemId: itemId,
      storageLocationId: a.storageLocationId,
      qty: a.qty,
    })),
  )
}

async function fetchRow(tx: Tx, id: string): Promise<InventoryItemRow | null> {
  const rows = await tx
    .select({
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
    })
    .from(inventoryItems)
    .leftJoin(contacts, eq(contacts.id, inventoryItems.supplierContactId))
    .where(eq(inventoryItems.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<ActionResult<InventoryItemRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createInventoryItemSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const supplierErr = await validateSupplier(tx, parsed.data.supplierContactId)
    if (supplierErr) return supplierErr

    const allocErr = await validateAllocations(tx, parsed.data.storageAllocations)
    if (allocErr) return allocErr

    if (await nameTaken(tx, parsed.data.name, parsed.data.type)) {
      return err(
        "CONFLICT",
        "An item with that name already exists in this type.",
        { name: ["That name is already in use for this type"] },
      )
    }

    const values = toStorage(parsed.data)
    const inserted = await tx
      .insert(inventoryItems)
      .values({ ...values, createdBy: ctx.userId })
      .returning({ id: inventoryItems.id })

    const id = inserted[0]!.id
    await syncAllocations(tx, id, parsed.data.storageAllocations)

    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new item.")

    await writeAudit({
      ctx,
      entityType: "inventory_item",
      entityId: id,
      action: "create",
      newValue: values,
    })

    return ok(row)
  })
}

export async function updateInventoryItem(
  id: string,
  input: UpdateInventoryItemInput,
): Promise<ActionResult<InventoryItemRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateInventoryItemSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select()
      .from(inventoryItems)
      .where(
        and(eq(inventoryItems.id, id), eq(inventoryItems.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That item no longer exists.")
    }

    const supplierErr = await validateSupplier(tx, parsed.data.supplierContactId)
    if (supplierErr) return supplierErr

    const allocErr = await validateAllocations(tx, parsed.data.storageAllocations)
    if (allocErr) return allocErr

    if (await nameTaken(tx, parsed.data.name, parsed.data.type, id)) {
      return err(
        "CONFLICT",
        "An item with that name already exists in this type.",
        { name: ["That name is already in use for this type"] },
      )
    }

    const values = toStorage(parsed.data)
    await tx
      .update(inventoryItems)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))

    await syncAllocations(tx, id, parsed.data.storageAllocations)

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That item no longer exists.")

    await writeAudit({
      ctx,
      entityType: "inventory_item",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name, type: existing[0].type },
      newValue: values,
    })

    return ok(row)
  })
}

export async function deleteInventoryItem(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: inventoryItems.id, name: inventoryItems.name })
      .from(inventoryItems)
      .where(
        and(eq(inventoryItems.id, id), eq(inventoryItems.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That item no longer exists.")
    }

    await tx
      .update(inventoryItems)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))

    await writeAudit({
      ctx,
      entityType: "inventory_item",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
