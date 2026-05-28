-- Cost Category / Cost Type swap.
--
-- The original 0026/0027 pair put the rich fields (basis, default rate,
-- override flag, status) on cost_categories and made cost_categories the
-- child of cost_types. That was backwards: cost_category is the simple
-- bucket ("Housekeeping", "Linen", ...) and cost_type is the named item
-- inside a category that carries the rate.
--
-- Tables here are pre-prod and nothing on the FRS application path
-- references them yet, so we drop both and recreate with the right shape.
-- The IsOverridden + amount-override mechanism that used to live on
-- cost_categories has been removed from Settings entirely; it will be
-- applied per-room in the Room module against cost_types.default_value.

DROP TABLE IF EXISTS "cost_categories";
--> statement-breakpoint
DROP TABLE IF EXISTS "cost_types";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."cost_basis";
--> statement-breakpoint

-- cost_categories: simple admin-managed bucket. Just a name. Global.

CREATE TABLE IF NOT EXISTS "cost_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cost_categories_name_active_uq"
  ON "cost_categories" (lower("name"))
  WHERE is_deleted = false;
--> statement-breakpoint

-- Initial categories Jenny named.
INSERT INTO "cost_categories" ("name") VALUES
	('Housekeeping'),
	('Consumables'),
	('Linen'),
	('Damages');
--> statement-breakpoint

-- cost_types: the rich row. Belongs to a category, carries a basis and a
-- default value. `can_be_overridden` is a policy flag that lets the Room
-- module accept a per-room amount later. `default_value_int` stores cents
-- for every basis except `percentage`, which stores basis points 0..10000.

CREATE TYPE "public"."cost_basis" AS ENUM ('flat', 'per_night', 'per_person', 'per_room', 'percentage');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "cost_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cost_category_id" uuid NOT NULL,
	"basis" "cost_basis" DEFAULT 'flat' NOT NULL,
	"default_value_int" integer DEFAULT 0 NOT NULL,
	"can_be_overridden" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cost_types_default_value_per_basis" CHECK (
		(basis = 'percentage' AND default_value_int BETWEEN 0 AND 10000)
		OR (basis <> 'percentage' AND default_value_int >= 0)
	)
);
--> statement-breakpoint
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "cost_types_name_per_category_uq"
  ON "cost_types" (lower("name"), "cost_category_id")
  WHERE is_deleted = false;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "cost_types_cost_category_idx"
  ON "cost_types" ("cost_category_id");
