-- 2FA: per-user one-time code emailed on sign-in. Plain text by product
-- decision; bounded by short TTL (10 min) and the attempts counter.
ALTER TABLE "users" ADD COLUMN "otp" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_attempts" integer DEFAULT 0 NOT NULL;
