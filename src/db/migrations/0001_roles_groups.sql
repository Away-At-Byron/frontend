-- ADR-003: reconcile roles to the 6-group model. Role module access is a
-- static code-owned map (src/lib/modules.ts); roles.permission_set is no
-- longer used for access, so it is left empty. Data-only migration.

-- Ensure the 6 groups exist.
INSERT INTO "roles" ("name") VALUES
  ('admin'), ('manager'), ('staff'),
  ('housekeeper'), ('contractor'), ('other')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Remap users on retired roles before dropping them.
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'staff')
  WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'front_desk');
--> statement-breakpoint
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'manager')
  WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'accounts');
--> statement-breakpoint

-- Drop retired roles.
DELETE FROM "roles" WHERE "name" IN ('front_desk', 'accounts');
