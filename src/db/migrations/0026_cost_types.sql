-- cost_types: admin-managed cost catalogue, global (follows ADR-007).
-- User-facing label is "Cost Types". Internal name disambiguates from the
-- FRS Layer 1 `costs` transactional table. Default rate stored as cents.

CREATE TABLE IF NOT EXISTS "cost_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_rate_cents" integer DEFAULT 0 NOT NULL,
	"can_overridden" boolean DEFAULT true NOT NULL,
	"is_deduction" boolean DEFAULT false NOT NULL,
	"is_addition" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cost_types_default_rate_nonneg" CHECK (default_rate_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "cost_types_name_active_uq"
  ON "cost_types" (lower("name"))
  WHERE is_deleted = false;
