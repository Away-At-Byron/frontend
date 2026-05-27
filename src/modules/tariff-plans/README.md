# Tariff (`tariff_plans`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the tariff catalogue - the named rate plans that bind
a tariff label (from `tariffs`), a property, and a room type, with a
status. User-facing label is **"Tariff"**.

## Tables

- `tariff_plans` - global (follows ADR-007). Created by migration
  `0025_tariff_plans.sql`. No seed.
- Postgres enum `tariff_status` (`active | inactive`).
- FKs to `tariffs.id` (ON DELETE RESTRICT) and `room_types.id`
  (RESTRICT). `property_id` is a plain `uuid` with **no FK constraint**
  per the client's instruction; the server action validates that the
  uuid exists in `properties` before insert/update.

## Routes

- `/settings/tariff-plans` - list, create, edit, delete. Admin role only.

## Behaviour

- **Name** required, max 100. Not enforced unique (an admin may want
  two tariffs with the same display name across different room types or
  properties).
- **Code** required, unique (case-insensitive) among active rows
  (`tariff_plans_code_active_uq` partial unique index). Format:
  uppercase letters and digits only. The modal auto-derives it from the
  name unless the admin has touched the field.
- **FK validation** runs in the action layer for all three of
  `tariff_beginning_price_id`, `property_id`, `room_type_id` - returns a
  per-field validation error if the uuid points at a missing or
  soft-deleted row.
- Soft delete preserves any historical reference once that data lands.
- Audit log fires on create / update / delete (`entity_type =
  tariff_plan`).

## Open questions

- **Property FK** is intentionally omitted in v1 per the client. When
  the relationship firms up, add the FK in a follow-up migration:
  `ALTER TABLE tariff_plans ADD CONSTRAINT
  tariff_plans_property_id_properties_id_fk FOREIGN KEY (property_id)
  REFERENCES properties(id) ON DELETE RESTRICT;`
- **Uniqueness on (property × room_type × beginning_price)** is not
  enforced. If that becomes a business rule, add a partial unique index
  on the triple WHERE is_deleted = false.
