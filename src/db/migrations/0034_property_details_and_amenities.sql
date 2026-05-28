-- Property module: extend `properties` with the Edit Property fields,
-- and add the property ↔ amenity assignment table.
--
-- New columns on properties:
--   property_manager_user_id  → users.id    (manager, autoprefills below)
--   on_call_number            text          (editable, prefilled from manager)
--   property_email            text          (editable, prefilled from manager)
--   lockbox_access            text
--   wifi_network              text
--   owner1_contact_id         → contacts.id (email/phone read live)
--   owner2_contact_id         → contacts.id (email/phone read live)
--
-- New table property_amenity_assignments — M:N between properties and the
-- admin-managed property_amenities catalogue (ADR-009).

ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "address_state" text,
  ADD COLUMN IF NOT EXISTS "website" text,
  ADD COLUMN IF NOT EXISTS "property_manager_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "on_call_number" text,
  ADD COLUMN IF NOT EXISTS "property_email" text,
  ADD COLUMN IF NOT EXISTS "lockbox_access" text,
  ADD COLUMN IF NOT EXISTS "wifi_network" text,
  ADD COLUMN IF NOT EXISTS "owner1_contact_id" uuid,
  ADD COLUMN IF NOT EXISTS "owner2_contact_id" uuid;
--> statement-breakpoint

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_property_manager_user_id_fk"
  FOREIGN KEY ("property_manager_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_owner1_contact_id_fk"
  FOREIGN KEY ("owner1_contact_id") REFERENCES "public"."contacts"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_owner2_contact_id_fk"
  FOREIGN KEY ("owner2_contact_id") REFERENCES "public"."contacts"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "property_amenity_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "property_amenity_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "property_amenity_assignments"
  ADD CONSTRAINT "property_amenity_assignments_property_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "property_amenity_assignments"
  ADD CONSTRAINT "property_amenity_assignments_property_amenity_id_fk"
  FOREIGN KEY ("property_amenity_id") REFERENCES "public"."property_amenities"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "property_amenity_assignments_pair_uq"
  ON "property_amenity_assignments" ("property_id", "property_amenity_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "property_amenity_assignments_property_idx"
  ON "property_amenity_assignments" ("property_id");
