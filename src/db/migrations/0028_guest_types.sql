-- guest_types: admin-managed catalogue, replaces the guest_type enum on
-- contacts. Same precedent as 0012_contact_sources.sql.
CREATE TABLE IF NOT EXISTS "guest_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest_types" ADD CONSTRAINT "guest_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Seed the guest type catalogue (preserves the original enum vocabulary).
INSERT INTO "guest_types" ("name") VALUES
	('Leisure'),
	('Corporate'),
	('Family'),
	('Couple'),
	('Group'),
	('VIP'),
	('Event Guest');
--> statement-breakpoint

-- contacts: enum guest_type -> FK guest_type_id. Backfill by mapping the
-- old enum value to the matching seeded name. Guarded so this also runs
-- on dev DBs where the enum column may not exist anymore.
ALTER TABLE "contacts" ADD COLUMN "guest_type_id" uuid;
--> statement-breakpoint
DO $migrate$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'guest_type'
  ) THEN
    EXECUTE $sql$
      UPDATE "contacts" c
      SET "guest_type_id" = gt.id
      FROM "guest_types" gt
      WHERE gt.name = CASE c."guest_type"::text
        WHEN 'leisure'     THEN 'Leisure'
        WHEN 'corporate'   THEN 'Corporate'
        WHEN 'family'      THEN 'Family'
        WHEN 'couple'      THEN 'Couple'
        WHEN 'group'       THEN 'Group'
        WHEN 'vip'         THEN 'VIP'
        WHEN 'event_guest' THEN 'Event Guest'
      END
    $sql$;
  END IF;
END
$migrate$;
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_guest_type_id_guest_types_id_fk" FOREIGN KEY ("guest_type_id") REFERENCES "public"."guest_types"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "guest_type";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."guest_type";
