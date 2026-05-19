CREATE TABLE IF NOT EXISTS "user_module_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_module_access_user_module_unique" UNIQUE("user_id","module_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_module_access" ADD CONSTRAINT "user_module_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
