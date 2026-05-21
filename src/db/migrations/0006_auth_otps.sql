CREATE TYPE "public"."otp_subject_type" AS ENUM('user', 'contact');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "otp_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_otps_active_one_per_subject" ON "auth_otps" USING btree ("subject_type","subject_id") WHERE "auth_otps"."consumed_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_otps_subject_idx" ON "auth_otps" USING btree ("subject_type","subject_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "otp";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "otp_expires_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "otp_attempts";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "otp";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "otp_expires_at";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "otp_attempts";