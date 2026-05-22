-- New enums for the expanded contact profile (ADR-006).
CREATE TYPE "public"."contact_id_type" AS ENUM('passport', 'drivers_license', 'national_id');--> statement-breakpoint
CREATE TYPE "public"."contact_tier" AS ENUM('bronze', 'silver', 'gold', 'vip');--> statement-breakpoint
CREATE TYPE "public"."contact_source" AS ENUM('website_direct_booking', 'phone_enquiry', 'email_sms_enquiry', 'referral', 'social_media', 'ota', 'advertising', 'events', 'email_campaign', 'travel_agent', 'corporate_account', 'group_booking_partner', 'other');--> statement-breakpoint
CREATE TYPE "public"."guest_type" AS ENUM('leisure', 'corporate', 'family', 'couple', 'group', 'vip', 'event_guest');--> statement-breakpoint

-- contact_types: admin-managed catalogue, replaces the contact_type enum.
CREATE TABLE IF NOT EXISTS "contact_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

-- groups: group bookings.
CREATE TABLE IF NOT EXISTS "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" text NOT NULL,
	"relationships" text,
	"company_name" text,
	"corporate_account_id" text,
	"travel_agent_id" text,
	"group_booker_flag" boolean DEFAULT false NOT NULL,
	"billing_preference" text,
	"tax_abn" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_types" ADD CONSTRAINT "contact_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "groups_group_name_unique" ON "groups" USING btree ("group_name");--> statement-breakpoint

-- Seed the contact type catalogue.
INSERT INTO "contact_types" ("name") VALUES
	('Guest - Standard Direct'),
	('Guest - Corporate Direct'),
	('Guest - OTA'),
	('Guest - Group Primary'),
	('Guest - Group Standard'),
	('Agent'),
	('Owner'),
	('Supplier'),
	('Lead');
--> statement-breakpoint

-- contacts: enum contact_type -> FK contact_type_id. Backfill existing rows
-- to "Guest - Standard Direct" (old guest/housekeeper/contractor values have
-- no 1:1 equivalent; an admin reassigns in Settings).
ALTER TABLE "contacts" ADD COLUMN "contact_type_id" uuid;--> statement-breakpoint
UPDATE "contacts" SET "contact_type_id" = (SELECT "id" FROM "contact_types" WHERE "name" = 'Guest - Standard Direct' LIMIT 1);--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_type_id_contact_types_id_fk" FOREIGN KEY ("contact_type_id") REFERENCES "public"."contact_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "contact_type";--> statement-breakpoint
DROP TYPE "public"."contact_type";--> statement-breakpoint

-- contacts: drop the per-property columns and their indexes (ADR-006).
DROP INDEX IF EXISTS "contacts_property_client_number";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_property_client_seq";--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_property_id_properties_id_fk";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "property_id";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "client_number";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "client_seq";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "booking_id";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "group_name";--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "is_vip";--> statement-breakpoint

-- contacts: birthday date -> char(5) "MM-DD" (drop the year).
ALTER TABLE "contacts" ADD COLUMN "birthday_md" char(5);--> statement-breakpoint
UPDATE "contacts" SET "birthday_md" = to_char("birthday", 'MM-DD') WHERE "birthday" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "birthday";--> statement-breakpoint
ALTER TABLE "contacts" RENAME COLUMN "birthday_md" TO "birthday";--> statement-breakpoint

-- contacts: group_id becomes a real FK to groups.
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- contacts: new identity / booking-profile columns.
ALTER TABLE "contacts" ADD COLUMN "id_type" "contact_id_type";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "id_number" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "id_country" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "id_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "id_verification_date" date;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "first_booking_date" date;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "preferred_booking_channel" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "ota_user" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "direct_booking_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "corporate_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "special_requests" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "accessibility_requirements" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "last_contact_date" date;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "do_not_rebook" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "tier" "contact_tier";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source" "contact_source";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "guest_type" "guest_type";
