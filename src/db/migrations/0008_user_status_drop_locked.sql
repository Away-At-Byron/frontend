-- Drop 'locked' from user_status: the status list is now Active or Disabled
-- only. Postgres cannot remove a value from an enum in place, so the type
-- is recreated. Any existing 'locked' user is migrated to 'disabled' (a
-- locked account is not usable, so 'disabled' is the closest surviving state).
ALTER TYPE "public"."user_status" RENAME TO "user_status_old";--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."user_status" USING (
	CASE WHEN "status"::text = 'locked' THEN 'disabled' ELSE "status"::text END
)::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
DROP TYPE "public"."user_status_old";
