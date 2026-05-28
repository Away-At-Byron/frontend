-- Property module: Images & attachments tab. Two tables.
--
-- property_images   — logo / hero / gallery images. One row per file,
--                     bytes in MinIO under file_key. Partial unique
--                     indexes enforce one logo + one hero per property.
-- property_documents — PDFs, brochures, contracts, surveys, floor plans.

CREATE TYPE "public"."property_image_role" AS ENUM ('logo', 'hero', 'gallery');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "property_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "role" "property_image_role" NOT NULL,
  "file_key" text NOT NULL,
  "mime_type" text,
  "size_bytes" integer,
  "width_px" integer,
  "height_px" integer,
  "caption" text,
  "sort_order" smallint DEFAULT 0 NOT NULL,
  "uploaded_by" uuid,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

ALTER TABLE "property_images"
  ADD CONSTRAINT "property_images_property_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "property_images"
  ADD CONSTRAINT "property_images_uploaded_by_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- At most one active logo and one active hero per property.
CREATE UNIQUE INDEX IF NOT EXISTS "property_images_one_logo_per_property"
  ON "property_images" ("property_id")
  WHERE "role" = 'logo' AND "is_deleted" = false;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "property_images_one_hero_per_property"
  ON "property_images" ("property_id")
  WHERE "role" = 'hero' AND "is_deleted" = false;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "property_images_property_role_idx"
  ON "property_images" ("property_id", "role", "sort_order");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "property_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "file_key" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "uploaded_by" uuid,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

ALTER TABLE "property_documents"
  ADD CONSTRAINT "property_documents_property_id_fk"
  FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "property_documents"
  ADD CONSTRAINT "property_documents_uploaded_by_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "property_documents_property_id_idx"
  ON "property_documents" ("property_id");
