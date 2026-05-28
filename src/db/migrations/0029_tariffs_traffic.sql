-- tariffs: add `traffic` column. Marks where a tariff is sourced from
-- (OTA, direct booking, or other). Existing rows default to 'direct'.
CREATE TYPE "public"."tariff_traffic" AS ENUM('ota', 'direct', 'other');
--> statement-breakpoint
ALTER TABLE "tariffs" ADD COLUMN "traffic" "tariff_traffic" NOT NULL DEFAULT 'direct';
