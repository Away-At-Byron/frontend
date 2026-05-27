-- discount_types: admin-managed catalogue, global (follows ADR-007).
-- value_int means cents for flat/cashback OR basis points 0..10000 for
-- percentage. CHECK constraints enforce per-type ranges. No seed - admins
-- create the first rows from the Settings page.

CREATE TYPE "public"."discount_type_kind" AS ENUM ('percentage', 'flat', 'cashback');
--> statement-breakpoint
CREATE TYPE "public"."discount_activation_mode" AS ENUM ('duration', 'manual');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "discount_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" "discount_type_kind" NOT NULL,
	"value_int" integer NOT NULL,
	"max_discount_cents" integer,
	"duration_start" date,
	"duration_end" date,
	"activation_mode" "discount_activation_mode" DEFAULT 'duration' NOT NULL,
	"min_amount_cents" integer,
	"min_nights" smallint,
	"stackable" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "discount_types_value_int_per_type" CHECK (
		(type = 'percentage' AND value_int BETWEEN 0 AND 10000)
		OR (type IN ('flat', 'cashback') AND value_int >= 0)
	),
	CONSTRAINT "discount_types_duration_order" CHECK (
		duration_start IS NULL OR duration_end IS NULL OR duration_end >= duration_start
	),
	CONSTRAINT "discount_types_min_nights_positive" CHECK (
		min_nights IS NULL OR min_nights >= 1
	),
	CONSTRAINT "discount_types_max_discount_nonneg" CHECK (
		max_discount_cents IS NULL OR max_discount_cents >= 0
	),
	CONSTRAINT "discount_types_min_amount_nonneg" CHECK (
		min_amount_cents IS NULL OR min_amount_cents >= 0
	)
);
--> statement-breakpoint
ALTER TABLE "discount_types" ADD CONSTRAINT "discount_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Partial unique on code (case-insensitive) among active rows.
CREATE UNIQUE INDEX IF NOT EXISTS "discount_types_code_active_uq"
  ON "discount_types" (lower("code"))
  WHERE is_deleted = false;
