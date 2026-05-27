-- cost_categories: admin-managed cost-type variants, global (follows
-- ADR-007). Each row is a named variant of a cost type with its own basis
-- and amount. `amount_int` means cents for non-percentage bases, basis
-- points 0..10000 for percentage.

CREATE TYPE "public"."cost_basis" AS ENUM ('flat', 'per_night', 'per_person', 'per_room', 'percentage');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cost_type_id" uuid NOT NULL,
	"basis" "cost_basis" DEFAULT 'flat' NOT NULL,
	"amount_int" integer DEFAULT 0 NOT NULL,
	"is_overridden" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cost_categories_amount_per_basis" CHECK (
		(basis = 'percentage' AND amount_int BETWEEN 0 AND 10000)
		OR (basis <> 'percentage' AND amount_int >= 0)
	)
);
--> statement-breakpoint
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_cost_type_id_cost_types_id_fk" FOREIGN KEY ("cost_type_id") REFERENCES "public"."cost_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- One name per cost_type among active rows (case-insensitive on name).
CREATE UNIQUE INDEX IF NOT EXISTS "cost_categories_name_per_type_uq"
  ON "cost_categories" (lower("name"), "cost_type_id")
  WHERE is_deleted = false;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "cost_categories_cost_type_idx"
  ON "cost_categories" ("cost_type_id");
