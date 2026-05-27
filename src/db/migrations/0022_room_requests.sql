-- room_requests: admin-managed catalogue, global (follows ADR-007).
-- Name is unique (case-insensitive) among active rows; code is optional and
-- unique-when-set (case-insensitive) among active rows.
CREATE TABLE IF NOT EXISTS "room_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_requests" ADD CONSTRAINT "room_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "room_requests_name_active_uq"
  ON "room_requests" (lower("name"))
  WHERE is_deleted = false;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "room_requests_code_active_uq"
  ON "room_requests" (lower("code"))
  WHERE is_deleted = false AND "code" IS NOT NULL;
--> statement-breakpoint

-- Seed the room request catalogue. Codes left null - admins fill them in
-- from the Settings page as needed.
INSERT INTO "room_requests" ("name") VALUES
	('Early Check-In'),
	('Extra Bed'),
	('Extra Person'),
	('High Chair'),
	('Late Arrival'),
	('Late Check-Out'),
	('Mid Stay Service'),
	('Portacot'),
	('Safety Gate'),
	('Sales Lead'),
	('See Res Notes'),
	('To Do List - Master');
