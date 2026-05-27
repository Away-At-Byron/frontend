-- tariff_plans: admin-managed catalogue binding a tariff label (from
-- `tariffs`) to a property and room type. User-facing label is "Tariff".
-- `property_id` is a plain uuid (no FK) per the client's instruction.

CREATE TYPE "public"."tariff_status" AS ENUM ('active', 'inactive');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tariff_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"tariff_beginning_price_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"status" "tariff_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tariff_plans" ADD CONSTRAINT "tariff_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tariff_plans" ADD CONSTRAINT "tariff_plans_tariff_beginning_price_id_tariffs_id_fk" FOREIGN KEY ("tariff_beginning_price_id") REFERENCES "public"."tariffs"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tariff_plans" ADD CONSTRAINT "tariff_plans_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "tariff_plans_code_active_uq"
  ON "tariff_plans" (lower("code"))
  WHERE is_deleted = false;
--> statement-breakpoint

-- Indexes on the lookup columns so the management page list queries stay fast.
CREATE INDEX IF NOT EXISTS "tariff_plans_beginning_price_idx"
  ON "tariff_plans" ("tariff_beginning_price_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tariff_plans_room_type_idx"
  ON "tariff_plans" ("room_type_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tariff_plans_property_idx"
  ON "tariff_plans" ("property_id");
