-- contact_sources: admin-managed catalogue, replaces the contact_source enum.
-- Mirrors the contact_types pattern from migration 0009.
CREATE TABLE IF NOT EXISTS "contact_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_sources" ADD CONSTRAINT "contact_sources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Seed the contact source catalogue.
INSERT INTO "contact_sources" ("name") VALUES
	('Website Direct Booking'),
	('Phone Enquiry'),
	('Email / SMS Enquiry'),
	('Referral'),
	('Social Media'),
	('OTA'),
	('Advertising'),
	('Events'),
	('Email Campaign'),
	('Travel Agent'),
	('Corporate Account'),
	('Group Booking Partner'),
	('Other');
--> statement-breakpoint

-- contacts: enum source -> FK contact_source_id. Backfill by mapping the old
-- enum value to the matching seeded name.
-- Backfill + drop are guarded so this also runs on dev DBs where 0009 was
-- edited after first apply and the `source` column / enum never landed.
ALTER TABLE "contacts" ADD COLUMN "contact_source_id" uuid;--> statement-breakpoint
DO $migrate$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'source'
  ) THEN
    EXECUTE $sql$
      UPDATE "contacts" c
      SET "contact_source_id" = cs.id
      FROM "contact_sources" cs
      WHERE cs.name = CASE c."source"::text
        WHEN 'website_direct_booking' THEN 'Website Direct Booking'
        WHEN 'phone_enquiry'          THEN 'Phone Enquiry'
        WHEN 'email_sms_enquiry'      THEN 'Email / SMS Enquiry'
        WHEN 'referral'               THEN 'Referral'
        WHEN 'social_media'           THEN 'Social Media'
        WHEN 'ota'                    THEN 'OTA'
        WHEN 'advertising'            THEN 'Advertising'
        WHEN 'events'                 THEN 'Events'
        WHEN 'email_campaign'         THEN 'Email Campaign'
        WHEN 'travel_agent'           THEN 'Travel Agent'
        WHEN 'corporate_account'      THEN 'Corporate Account'
        WHEN 'group_booking_partner'  THEN 'Group Booking Partner'
        WHEN 'other'                  THEN 'Other'
      END
    $sql$;
  END IF;
END
$migrate$;
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_source_id_contact_sources_id_fk" FOREIGN KEY ("contact_source_id") REFERENCES "public"."contact_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "source";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."contact_source";
