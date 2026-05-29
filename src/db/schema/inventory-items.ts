import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  date,
  timestamp,
  boolean,
  check,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { contacts } from "./contacts"

/**
 * Property module: Inventory catalogue. Global (ADR-007). Three flavours via
 * `type`, each with its own exclusive fields. `quantity_on_hand` lives on
 * every type (assets carry the total count too). The CHECK constraint
 * enforces that every per-type column not belonging to a row's type is NULL.
 *
 * Storage locations live in a separate table; an inventory item can be
 * spread across many locations via `inventory_item_storage_assignments`.
 *
 * Money fields are int cents. The form removed Category, but the column is
 * kept in case a later workflow surfaces it.
 */
export const inventoryItemTypeEnum = pgEnum("inventory_item_type", [
  "asset",
  "inventory",
  "consumable",
])

export const inventoryItemStatusEnum = pgEnum("inventory_item_status", [
  "in_service",
  "unavailable",
  "retired",
])

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: inventoryItemTypeEnum("type").notNull(),
    category: text("category"),
    status: inventoryItemStatusEnum("status").notNull().default("in_service"),
    description: text("description"),
    photoKey: text("photo_key"),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),

    // ── Asset only ──────────────────────────────────────────
    warrantyExpiry: date("warranty_expiry"),
    expectedUsefulLife: text("expected_useful_life"),

    // ── Inventory only ─────────────────────────────────────
    minimumThreshold: integer("minimum_threshold"),
    replacementCostCents: integer("replacement_cost_cents"),

    // ── Consumable only ────────────────────────────────────
    reorderLevel: integer("reorder_level"),
    unitCostCents: integer("unit_cost_cents"),
    supplierContactId: uuid("supplier_contact_id").references(
      () => contacts.id,
      { onDelete: "set null" },
    ),
    lastRestockedDate: date("last_restocked_date"),

    // ── Inventory + consumable (NOT asset) ─────────────────
    minimumReorderQty: integer("minimum_reorder_qty"),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    check(
      "inventory_items_fields_per_type",
      sql`(
        ${t.type} = 'asset'
          AND ${t.minimumThreshold} IS NULL
          AND ${t.replacementCostCents} IS NULL
          AND ${t.reorderLevel} IS NULL
          AND ${t.unitCostCents} IS NULL
          AND ${t.supplierContactId} IS NULL
          AND ${t.lastRestockedDate} IS NULL
          AND ${t.minimumReorderQty} IS NULL
      ) OR (
        ${t.type} = 'inventory'
          AND ${t.warrantyExpiry} IS NULL
          AND ${t.expectedUsefulLife} IS NULL
          AND ${t.reorderLevel} IS NULL
          AND ${t.unitCostCents} IS NULL
          AND ${t.supplierContactId} IS NULL
          AND ${t.lastRestockedDate} IS NULL
      ) OR (
        ${t.type} = 'consumable'
          AND ${t.warrantyExpiry} IS NULL
          AND ${t.expectedUsefulLife} IS NULL
          AND ${t.minimumThreshold} IS NULL
          AND ${t.replacementCostCents} IS NULL
      )`,
    ),
    check(
      "inventory_items_quantity_nonneg",
      sql`${t.quantityOnHand} >= 0`,
    ),
    check(
      "inventory_items_minimum_threshold_nonneg",
      sql`${t.minimumThreshold} IS NULL OR ${t.minimumThreshold} >= 0`,
    ),
    check(
      "inventory_items_reorder_level_nonneg",
      sql`${t.reorderLevel} IS NULL OR ${t.reorderLevel} >= 0`,
    ),
    check(
      "inventory_items_replacement_cost_nonneg",
      sql`${t.replacementCostCents} IS NULL OR ${t.replacementCostCents} >= 0`,
    ),
    check(
      "inventory_items_unit_cost_nonneg",
      sql`${t.unitCostCents} IS NULL OR ${t.unitCostCents} >= 0`,
    ),
    check(
      "inventory_items_minimum_reorder_qty_nonneg",
      sql`${t.minimumReorderQty} IS NULL OR ${t.minimumReorderQty} >= 0`,
    ),
    index("inventory_items_type_idx").on(t.type),
    index("inventory_items_supplier_idx").on(t.supplierContactId),
  ],
)

export type InventoryItem = typeof inventoryItems.$inferSelect
export type NewInventoryItem = typeof inventoryItems.$inferInsert

/**
 * Admin-managed catalogue of storage locations (Settings page). Global,
 * follows ADR-007. Soft delete so junction rows that referenced this
 * location keep their FK intact.
 */
export const storageLocations = pgTable(
  "storage_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    uniqueIndex("storage_locations_name_active_uq")
      .on(sql`lower(${t.name})`)
      .where(sql`${t.isDeleted} = false`),
  ],
)

export type StorageLocation = typeof storageLocations.$inferSelect
export type NewStorageLocation = typeof storageLocations.$inferInsert

/**
 * Many-to-many: an inventory item can sit in N storage locations with a
 * qty per location. The item's `quantity_on_hand` is the running total —
 * stored separately so a row can exist before any allocation is recorded.
 *
 * Unique on (storage_location_id, inventory_item_id) so the editor edits
 * existing pairs rather than stacking duplicates. Cascades on either side
 * (delete the location OR the item removes the link).
 */
export const inventoryItemStorageAssignments = pgTable(
  "inventory_item_storage_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageLocationId: uuid("storage_location_id")
      .notNull()
      .references(() => storageLocations.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "inventory_item_storage_assignments_qty_nonneg",
      sql`${t.qty} >= 0`,
    ),
    uniqueIndex("inv_storage_assignments_pair_uq").on(
      t.storageLocationId,
      t.inventoryItemId,
    ),
    index("inv_storage_assignments_item_idx").on(t.inventoryItemId),
  ],
)

export type InventoryItemStorageAssignment =
  typeof inventoryItemStorageAssignments.$inferSelect
export type NewInventoryItemStorageAssignment =
  typeof inventoryItemStorageAssignments.$inferInsert
