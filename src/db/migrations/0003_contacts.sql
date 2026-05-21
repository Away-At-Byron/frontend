CREATE TYPE "public"."contact_type" AS ENUM('guest', 'housekeeper', 'contractor');--> statement-breakpoint
CREATE TYPE "public"."communication_preference" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"client_number" text NOT NULL,
	"client_seq" integer NOT NULL,
	"contact_type" "contact_type" DEFAULT 'guest' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address_street" text,
	"address_suburb" text,
	"address_city" text,
	"address_postcode" text,
	"address_country" char(2) DEFAULT 'AU',
	"booking_id" uuid,
	"birthday" date,
	"communication_preference" "communication_preference" DEFAULT 'email' NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"related_client_id" uuid,
	"group_id" uuid,
	"group_name" text,
	"notes" text,
	"returning_guest" boolean DEFAULT false NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_related_client_id_contacts_id_fk" FOREIGN KEY ("related_client_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_property_client_number" ON "contacts" USING btree ("property_id","client_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_property_client_seq" ON "contacts" USING btree ("property_id","client_seq");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
