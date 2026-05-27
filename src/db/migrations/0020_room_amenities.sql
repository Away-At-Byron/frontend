-- room_amenities: admin-managed catalogue, global (not tenanted) per the
-- precedent in ADR-007. Distinct from property_amenities - this is the
-- per-room list. Name-only.
CREATE TABLE IF NOT EXISTS "room_amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_amenities" ADD CONSTRAINT "room_amenities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Seed the room amenity catalogue.
INSERT INTO "room_amenities" ("name") VALUES
	('Air Conditioning'),
	('Smart TV'),
	('Private Bathroom'),
	('Hair Dryer'),
	('Coffee Machine'),
	('Balcony');
