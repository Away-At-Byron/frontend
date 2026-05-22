-- contacts: soft-delete flag. Flipping it instead of removing the row keeps
-- historical bookings and FK references to the contact intact, matching the
-- contact_types pattern.
ALTER TABLE "contacts" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;
