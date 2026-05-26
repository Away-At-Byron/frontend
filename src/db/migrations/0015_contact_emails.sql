-- Outbound email log for the Contact > Communication tab.
--   * One row per email sent from the staff console (Phase 1: outbound only).
--   * Inbound + reply threading is deferred until after the build is feature
--     complete (see CLAUDE.md / contact-detail-communication TODO).
--   * Attachments reuse contact_documents (type='communication') with a new
--     `email_id` link — same pattern as `message_id` for in-portal chat.

DO $$ BEGIN
  CREATE TYPE "public"."contact_email_status" AS ENUM('sent', 'failed', 'queued');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "contact_emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contact_id" uuid NOT NULL,
  "from_address" text NOT NULL,
  "to_addresses" text[] NOT NULL,
  "cc_addresses" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "bcc_addresses" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "subject" text NOT NULL,
  "body_text" text NOT NULL,
  "body_html" text,
  "status" "contact_email_status" NOT NULL DEFAULT 'queued',
  "error_message" text,
  "sent_at" timestamp with time zone,
  "sent_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_emails" ADD CONSTRAINT "contact_emails_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_emails" ADD CONSTRAINT "contact_emails_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_emails_contact_id_created_at_idx" ON "contact_emails" USING btree ("contact_id","created_at");--> statement-breakpoint

ALTER TABLE "contact_documents" ADD COLUMN IF NOT EXISTS "email_id" uuid;--> statement-breakpoint
ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_email_id_contact_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."contact_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_documents_email_id_idx" ON "contact_documents" USING btree ("email_id");
