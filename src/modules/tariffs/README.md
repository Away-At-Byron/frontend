# Tariff Type (`tariffs`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the tariff catalogue. User-facing label is
**"Tariff Type"**. Each row carries a basis (Per Night / Per Week /
Long Stay), a refundable + breakfast posture, optional property/room
scope, an optional tariff period (from the `tariff_periods` catalogue),
and a status.

## Tables

- `tariffs` - global (follows ADR-007). Created by `0024_tariffs.sql`
  (seed of 8 default labels), extended by `0029_tariffs_traffic.sql`
  (traffic column), `0031_tariffs_expand.sql` (code, property/room
  scope, basis, refundable, breakfast, status — also drops the old
  `tariff_plans` table), and `0032_tariffs_period.sql` (optional
  `tariff_period_id` FK with ON DELETE SET NULL).
- Postgres enums `tariff_basis` (`per_night | per_week | long_stay`),
  `tariff_traffic` (`ota | direct | other`), `tariff_status`
  (`active | inactive`).
- `property_id` and `room_id` are plain `uuid`s with **no FK
  constraint**. `property_id` follows the precedent set by the old
  `tariff_plans.property_id`; `room_id` is a placeholder for the rooms
  table that lands later.

## Routes

- `/settings/tariff-types` - list, create, edit, delete. Admin role only.

## Behaviour

- **Name** required, max 80, unique (case-insensitive) among active rows.
- **Code** required, unique (case-insensitive) among active rows
  (`tariffs_code_active_uq` partial unique index). Format: uppercase
  letters and digits only. The modal auto-derives it from the name
  unless the admin has touched the field.
- **Property** dropdown defaults to "All properties" (stored as NULL).
  When set, the server action validates the uuid exists in `properties`.
- **Room** stored as a nullable uuid; the rooms table has not landed
  yet, so the field is unvalidated for now.
- Soft delete preserves any historical reference once rate plans land.
- Audit log fires on create / update / delete
  (`entity_type = tariff`).

## Open questions

- **Property FK** is intentionally omitted in v1 per the client
  precedent set by the old `tariff_plans` table. When the relationship
  firms up, add the FK in a follow-up migration.
- **Room FK** will be added once the rooms table exists.
- **In-use guard** is vacuous - no rate_plans table yet. When module
  10 lands, the delete action should block when any active rate_plan
  references the tariff, and `listTariffs` should expose a real
  `usageCount` via leftJoin.
