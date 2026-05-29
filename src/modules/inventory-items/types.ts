/** Shared inventory DTOs — client-safe (no Drizzle imports). */

export type InventoryItemType = "asset" | "inventory" | "consumable"

export type InventoryItemStatus = "in_service" | "unavailable" | "retired"

export type StorageAllocation = {
  storageLocationId: string
  storageLocationName: string
  qty: number
}

export type InventoryItemRow = {
  id: string
  name: string
  type: InventoryItemType
  category: string | null
  status: InventoryItemStatus
  description: string | null
  photoKey: string | null
  /** Total on-hand across all storage locations. Lives on every type. */
  quantityOnHand: number

  // ── Asset only ────────────────────────────────────────────
  warrantyExpiry: string | null
  expectedUsefulLife: string | null

  // ── Inventory only ────────────────────────────────────────
  minimumThreshold: number | null
  replacementCostCents: number | null

  // ── Consumable only ───────────────────────────────────────
  reorderLevel: number | null
  unitCostCents: number | null
  supplierContactId: string | null
  supplierName: string | null
  lastRestockedDate: string | null

  // ── Inventory + consumable (not asset) ────────────────────
  minimumReorderQty: number | null

  createdAt: Date | string
  updatedAt: Date | string
}

export type SupplierOption = {
  id: string
  name: string
}

export const TYPE_LABEL: Record<InventoryItemType, string> = {
  asset: "Asset",
  inventory: "Inventory",
  consumable: "Consumable",
}

export const STATUS_LABEL: Record<InventoryItemStatus, string> = {
  in_service: "In service",
  unavailable: "Unavailable",
  retired: "Retired",
}
