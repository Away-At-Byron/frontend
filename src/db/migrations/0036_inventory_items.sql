-- Property module: Inventory catalogue + storage locations.
--
-- inventory_items
--   One table covering three kinds via the `type` enum, each with its own
--   exclusive fields:
--
--     asset       quantity_on_hand, warranty_expiry, expected_useful_life
--     inventory   quantity_on_hand, storage_location (via junction), minimum_threshold,
--                 replacement_cost_cents, minimum_reorder_qty
--     consumable  quantity_on_hand, reorder_level, unit_cost_cents,
--                 supplier_contact_id, last_restocked_date, minimum_reorder_qty
--     all three   name, type, status, description, photo_key (+ category column kept
--                 in case a later workflow needs it; form removed for now)
--
--   The per-type CHECK enforces that every column not belonging to a row's
--   type is NULL, so a buggy action layer can't leak (e.g. a warranty date
--   on a consumable).
--
-- storage_locations
--   Admin-managed catalogue (Settings page). Global, follows ADR-007.
--
-- inventory_item_storage_assignments
--   Junction: one inventory item can live in many storage locations with
--   a qty per location. Unique on (storage_location_id, inventory_item_id)
--   so the editor edits-in-place per pair.

CREATE TYPE "public"."inventory_item_type" AS ENUM ('asset', 'inventory', 'consumable');
--> statement-breakpoint
CREATE TYPE "public"."inventory_item_status" AS ENUM ('in_service', 'unavailable', 'retired');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" "inventory_item_type" NOT NULL,
  "category" text,
  "status" "inventory_item_status" DEFAULT 'in_service' NOT NULL,
  "description" text,
  "photo_key" text,
  "quantity_on_hand" integer DEFAULT 0 NOT NULL,

  -- asset only
  "warranty_expiry" date,
  "expected_useful_life" text,

  -- inventory only
  "minimum_threshold" integer,
  "replacement_cost_cents" integer,

  -- consumable only
  "reorder_level" integer,
  "unit_cost_cents" integer,
  "supplier_contact_id" uuid,
  "last_restocked_date" date,

  -- inventory + consumable (not asset)
  "minimum_reorder_qty" integer,

  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,

  CONSTRAINT "inventory_items_fields_per_type" CHECK (
    (
      type = 'asset'
        AND minimum_threshold IS NULL
        AND replacement_cost_cents IS NULL
        AND reorder_level IS NULL
        AND unit_cost_cents IS NULL
        AND supplier_contact_id IS NULL
        AND last_restocked_date IS NULL
        AND minimum_reorder_qty IS NULL
    ) OR (
      type = 'inventory'
        AND warranty_expiry IS NULL
        AND expected_useful_life IS NULL
        AND reorder_level IS NULL
        AND unit_cost_cents IS NULL
        AND supplier_contact_id IS NULL
        AND last_restocked_date IS NULL
    ) OR (
      type = 'consumable'
        AND warranty_expiry IS NULL
        AND expected_useful_life IS NULL
        AND minimum_threshold IS NULL
        AND replacement_cost_cents IS NULL
    )
  ),
  CONSTRAINT "inventory_items_quantity_nonneg" CHECK (quantity_on_hand >= 0),
  CONSTRAINT "inventory_items_minimum_threshold_nonneg" CHECK (
    minimum_threshold IS NULL OR minimum_threshold >= 0
  ),
  CONSTRAINT "inventory_items_reorder_level_nonneg" CHECK (
    reorder_level IS NULL OR reorder_level >= 0
  ),
  CONSTRAINT "inventory_items_replacement_cost_nonneg" CHECK (
    replacement_cost_cents IS NULL OR replacement_cost_cents >= 0
  ),
  CONSTRAINT "inventory_items_unit_cost_nonneg" CHECK (
    unit_cost_cents IS NULL OR unit_cost_cents >= 0
  ),
  CONSTRAINT "inventory_items_minimum_reorder_qty_nonneg" CHECK (
    minimum_reorder_qty IS NULL OR minimum_reorder_qty >= 0
  )
);
--> statement-breakpoint

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_supplier_contact_id_fk"
  FOREIGN KEY ("supplier_contact_id") REFERENCES "public"."contacts"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inventory_items_type_idx"
  ON "inventory_items" ("type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inventory_items_supplier_idx"
  ON "inventory_items" ("supplier_contact_id");
--> statement-breakpoint

-- ── storage_locations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storage_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

ALTER TABLE "storage_locations"
  ADD CONSTRAINT "storage_locations_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "storage_locations_name_active_uq"
  ON "storage_locations" (lower("name"))
  WHERE is_deleted = false;
--> statement-breakpoint

-- ── inventory_item_storage_assignments ────────────────────
-- One row per (storage_location, inventory_item). Qty is how many of that
-- item live at that location. The item's quantity_on_hand should equal the
-- sum of these qty's, but it's stored separately so a row can exist with no
-- storage rows yet (e.g. consumable not yet allocated).
CREATE TABLE IF NOT EXISTS "inventory_item_storage_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "storage_location_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "qty" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_item_storage_assignments_qty_nonneg" CHECK (qty >= 0)
);
--> statement-breakpoint

ALTER TABLE "inventory_item_storage_assignments"
  ADD CONSTRAINT "inv_storage_assignments_location_fk"
  FOREIGN KEY ("storage_location_id") REFERENCES "public"."storage_locations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "inventory_item_storage_assignments"
  ADD CONSTRAINT "inv_storage_assignments_item_fk"
  FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "inv_storage_assignments_pair_uq"
  ON "inventory_item_storage_assignments" ("storage_location_id", "inventory_item_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inv_storage_assignments_item_idx"
  ON "inventory_item_storage_assignments" ("inventory_item_id");
