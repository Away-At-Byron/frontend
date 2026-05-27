-- tariffs: admin-managed catalogue of tariff (rate label) entries, global
-- (follows ADR-007). User-facing label is "Tariff Beginning Price". The
-- table holds vocabulary only; future rate_plans table will carry prices.
CREATE TABLE IF NOT EXISTS "tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "tariffs_name_active_uq"
  ON "tariffs" (lower("name"))
  WHERE is_deleted = false;
--> statement-breakpoint

-- Seed the tariff catalogue.
INSERT INTO "tariffs" ("name") VALUES
	('Standard Weekday Rate'),
	('Weekend Rate'),
	('Peak Season'),
	('Non Peak Season'),
	('Standard Flexible'),
	('Non-Refundable'),
	('Weekend Escape'),
	('Breakfast Included');
