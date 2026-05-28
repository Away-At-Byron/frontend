-- Expand `tariffs` to absorb the Tariff Table (`tariff_plans`). Adds:
--   code, property_id, room_id, tariff_basis, refundable,
--   breakfast_included, status.
-- The old `tariff_plans` table is dropped; its `tariff_status` enum is
-- reused by `tariffs.status`. `property_id` and `room_id` are plain
-- uuids (no FK) - `property_id` follows the same precedent as the old
-- `tariff_plans.property_id`; `room_id` is a placeholder for a rooms
-- table that has not landed yet.

DROP TABLE IF EXISTS "tariff_plans";
--> statement-breakpoint

CREATE TYPE "public"."tariff_basis" AS ENUM ('per_night', 'per_week', 'long_stay');
--> statement-breakpoint

ALTER TABLE "tariffs"
  ADD COLUMN "code" text,
  ADD COLUMN "property_id" uuid,
  ADD COLUMN "room_id" uuid,
  ADD COLUMN "tariff_basis" "tariff_basis",
  ADD COLUMN "refundable" boolean NOT NULL DEFAULT true,
  ADD COLUMN "breakfast_included" boolean NOT NULL DEFAULT false,
  ADD COLUMN "status" "tariff_status" NOT NULL DEFAULT 'active';
--> statement-breakpoint

-- Backfill required columns for any pre-existing seeded rows.
UPDATE "tariffs"
SET
  "code" = regexp_replace(upper("name"), '[^A-Z0-9]', '', 'g'),
  "tariff_basis" = 'per_night'
WHERE "code" IS NULL OR "tariff_basis" IS NULL;
--> statement-breakpoint

ALTER TABLE "tariffs"
  ALTER COLUMN "code" SET NOT NULL,
  ALTER COLUMN "tariff_basis" SET NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "tariffs_code_active_uq"
  ON "tariffs" (lower("code"))
  WHERE is_deleted = false;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "tariffs_property_idx"
  ON "tariffs" ("property_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "tariffs_room_idx"
  ON "tariffs" ("room_id");
