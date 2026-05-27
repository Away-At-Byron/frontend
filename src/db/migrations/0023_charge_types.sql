-- charge_types: admin-managed catalogue of invoice charge items, global
-- (follows ADR-007). User-facing label is "Booking Charges" - the internal
-- name disambiguates from the Layer 3 `booking_charges` table. Amount is
-- stored as integer cents.
CREATE TABLE IF NOT EXISTS "charge_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_amount_cents" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "charge_types_default_amount_nonneg" CHECK (default_amount_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "charge_types" ADD CONSTRAINT "charge_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "charge_types_name_active_uq"
  ON "charge_types" (lower("name"))
  WHERE is_deleted = false;
--> statement-breakpoint

-- Seed Jenny's initial 17 charge items. Names are preserved verbatim, so
-- the casing on "toiletries" and the spelling of "Commision" come from the
-- source spreadsheet; admins can edit either from the Settings page.
INSERT INTO "charge_types" ("name", "default_amount_cents") VALUES
	('Bond', 150000),
	('Bond Claim', 0),
	('Cancellation Fees', 20000),
	('Cleaning Fee', 0),
	('Credit Card Surcharge', 0),
	('Extra Bed', 10000),
	('Extra Person', 25000),
	('High Chair', 1000),
	('Late Check-Out', 15000),
	('Linen', 0),
	('Management Fees', 0),
	('Meet & Greet', 0),
	('OTA''s Agents Commision', 0),
	('Portacot', 2500),
	('Safety Gate', 1000),
	('toiletries', 0),
	('Waste Removal', 0);
