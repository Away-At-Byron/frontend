-- tariff_periods: admin-managed catalogue of labelled date ranges that
-- future rate plans can attach prices to (e.g. "Peak 2026"). Global,
-- follows ADR-007. Same precedent as 0024_tariffs.sql.
CREATE TABLE IF NOT EXISTS "tariff_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tariff_periods_date_order" CHECK ("to_date" >= "from_date")
);
--> statement-breakpoint
ALTER TABLE "tariff_periods" ADD CONSTRAINT "tariff_periods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "tariff_periods_code_active_uq"
  ON "tariff_periods" (lower("code"))
  WHERE is_deleted = false;
