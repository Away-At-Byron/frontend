-- room_configurations: admin-managed catalogue, global (not tenanted) per
-- ADR-008. Mirrors the room_types pattern from migration 0017.
CREATE TABLE IF NOT EXISTS "room_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_max_occupancy" smallint,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_configurations" ADD CONSTRAINT "room_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Seed the room configuration catalogue from Jenny's current layouts.
-- default_max_occupancy left null - admin sets it from the Settings page.
INSERT INTO "room_configurations" ("name") VALUES
	('King Ensuite, Kitchen, Living'),
	('King Ensuite, Private Balcony'),
	('King Ensuite'),
	('Queen Ensuite'),
	('2 King Rooms, Bathroom, Kitchen, Living'),
	('2 King Rooms, Queen Room, 2 Singles / 1 King, 2 Bathrooms'),
	('Queen Room, 2 Singles, Bathroom'),
	('2 Kings Rooms, 2 Bathrooms');
