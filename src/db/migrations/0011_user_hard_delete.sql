-- A user account can now be hard-deleted (FRS module 3, admin Delete action).
-- "Disable" stays a soft status change made through Edit; "Delete" removes the
-- row outright, so the foreign keys pointing at users.id must give way:
--
--   audit_log.user_id   - audit_log is append-only, so its actor FK is dropped
--                         rather than nulled on delete. The user_id value is
--                         kept as a dangling reference (the name lookup just
--                         resolves to nothing); no audit row is ever mutated.
--   contacts.created_by - nulled on delete; records outlive their author.
--                         Applies to every table built on tenantCols.
--   password_resets     - transient tokens, cascade away with the user.
--
-- sessions and user_module_access already cascade.
ALTER TABLE "audit_log" DROP CONSTRAINT IF EXISTS "audit_log_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" DROP CONSTRAINT IF EXISTS "password_resets_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
