-- In-portal communications (FRS §6.24, extended per session decision):
--   * One conversation per contact (staff ↔ contact)
--   * Append-only messages, sender is staff user OR the contact (XOR enforced)
--   * Conversations carry denormalised last_message_at + sender_type for the
--     unread heuristic ("unread for staff" = last sender was the contact)
--   * Attachments live in contact_documents with type='communication' and
--     are linked to the message via message_id.

DO $$ BEGIN
  CREATE TYPE "public"."message_sender_type" AS ENUM('user', 'contact');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contact_id" uuid NOT NULL,
  "last_message_at" timestamp with time zone,
  "last_message_sender_type" "message_sender_type",
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_contact_id_uq" ON "conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_type" "message_sender_type" NOT NULL,
  "sender_user_id" uuid,
  "sender_contact_id" uuid,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "messages_sender_xor_chk" CHECK (
    (sender_type = 'user'    AND sender_user_id    IS NOT NULL AND sender_contact_id IS NULL)
    OR
    (sender_type = 'contact' AND sender_contact_id IS NOT NULL AND sender_user_id    IS NULL)
  )
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_contact_id_contacts_id_fk" FOREIGN KEY ("sender_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint

-- Attach contact_documents to messages (only populated when type='communication').
ALTER TABLE "contact_documents" ADD COLUMN IF NOT EXISTS "message_id" uuid;--> statement-breakpoint
ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_documents_message_id_idx" ON "contact_documents" USING btree ("message_id");
