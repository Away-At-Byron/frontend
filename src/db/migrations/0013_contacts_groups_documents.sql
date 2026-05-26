-- Trim contacts booking-profile flags now covered by contact_type:
--   ota_user, direct_booking_guest, corporate_guest.
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "ota_user";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "direct_booking_guest";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "corporate_guest";--> statement-breakpoint

-- Extend the ID type enum with an "Other" option.
ALTER TYPE "public"."contact_id_type" ADD VALUE IF NOT EXISTS 'other';--> statement-breakpoint

-- Groups: free-text reason for the booking + free-text group age summary.
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "reason" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "group_age" text;--> statement-breakpoint

-- contact_documents: files and communication records per contact. Subtype
-- (e.g. "passport" under id_photo, "payment_receipt" under booking_documents)
-- is encoded in `description` for now; promote to a dedicated column if/when
-- queries need to filter by it.
DO $$ BEGIN
  CREATE TYPE "public"."contact_document_type" AS ENUM(
    'id_photo',
    'booking_documents',
    'other_documents',
    'communication'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "contact_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"type" "contact_document_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_key" text,
	"file_name" text,
	"mime_type" text,
	"size_bytes" integer,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_documents_contact_id_idx" ON "contact_documents" USING btree ("contact_id");
