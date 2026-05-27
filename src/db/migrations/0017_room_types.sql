-- room_types: admin-managed catalogue, global (not tenanted) per ADR-007.
-- Mirrors the contact_types / contact_sources pattern (migrations 0009, 0012).
CREATE TABLE IF NOT EXISTS "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_max_occupancy" smallint,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Seed the room type catalogue. default_max_occupancy left null - admin
-- sets it from the Settings page when they want it pre-filled on bookings.
INSERT INTO "room_types" ("name") VALUES
	('Self-contained Unit'),
	('Cottage'),
	('Room'),
	('Deluxe Garden Room'),
	('Apartment'),
	('Villa'),
	('Studio');
