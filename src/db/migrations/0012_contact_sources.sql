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
ALTER TABLE "contacts" ADD COLUMN "contact_source_id" uuid;--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Website Direct Booking' LIMIT 1) WHERE "source" = 'website_direct_booking';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Phone Enquiry' LIMIT 1) WHERE "source" = 'phone_enquiry';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Email / SMS Enquiry' LIMIT 1) WHERE "source" = 'email_sms_enquiry';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Referral' LIMIT 1) WHERE "source" = 'referral';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Social Media' LIMIT 1) WHERE "source" = 'social_media';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'OTA' LIMIT 1) WHERE "source" = 'ota';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Advertising' LIMIT 1) WHERE "source" = 'advertising';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Events' LIMIT 1) WHERE "source" = 'events';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Email Campaign' LIMIT 1) WHERE "source" = 'email_campaign';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Travel Agent' LIMIT 1) WHERE "source" = 'travel_agent';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Corporate Account' LIMIT 1) WHERE "source" = 'corporate_account';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Group Booking Partner' LIMIT 1) WHERE "source" = 'group_booking_partner';--> statement-breakpoint
UPDATE "contacts" SET "contact_source_id" = (SELECT "id" FROM "contact_sources" WHERE "name" = 'Other' LIMIT 1) WHERE "source" = 'other';--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_source_id_contact_sources_id_fk" FOREIGN KEY ("contact_source_id") REFERENCES "public"."contact_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "source";--> statement-breakpoint
DROP TYPE "public"."contact_source";
