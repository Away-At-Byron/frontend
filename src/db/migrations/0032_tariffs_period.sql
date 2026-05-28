-- tariffs: add optional `tariff_period_id` FK. When the referenced
-- period is hard-deleted the column nulls out; soft-delete is handled
-- at the application layer.

ALTER TABLE "tariffs"
  ADD COLUMN "tariff_period_id" uuid;
--> statement-breakpoint

ALTER TABLE "tariffs"
  ADD CONSTRAINT "tariffs_tariff_period_id_tariff_periods_id_fk"
  FOREIGN KEY ("tariff_period_id") REFERENCES "public"."tariff_periods"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "tariffs_tariff_period_idx"
  ON "tariffs" ("tariff_period_id");
