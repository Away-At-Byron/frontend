-- "Related contacts" on the Profile tab is no longer stored on this contact;
-- picking a contact in that field adds them to the current group as a
-- "Guest - Group Standard" secondary, via their own group_id / contact_type_id.
-- The legacy single-FK column is therefore unused — drop it.

ALTER TABLE "contacts" DROP COLUMN IF EXISTS "related_client_id";
