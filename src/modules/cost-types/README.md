# Cost Types (`cost_types`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the cost catalogue. Each row defines a cost item
inside a Cost Category with a basis (how the amount is applied), a
default value, and a flag saying whether the value may be overridden
per room. Global, follows ADR-007.

**Naming note:** the internal table is `cost_types` to avoid collision
with the Layer 1 `costs` transactional table planned in the FRS.

## Tables

- `cost_types` - global. Original 0026 migration is superseded by
  `0033_cost_category_type_swap.sql`, which drops both cost tables and
  recreates them in their final shape (FK to `cost_categories.id` with
  ON DELETE RESTRICT). No seed - admins create rows from Settings.
- Postgres enum `cost_basis` (`flat | per_night | per_person | per_room
  | percentage`).
- `default_value_int` stores **cents** for non-percentage bases and
  **basis points 0..10000** for percentage. CHECK enforces the range
  per basis.
- Partial unique index on `(lower(name), cost_category_id) WHERE
  is_deleted = false` so the same name can exist under different
  categories.

## Routes

- `/settings/cost-types` - list, create, edit, delete. Admin role only.

## Behaviour

- **Name** required, unique per category (case-insensitive) among
  active rows.
- **Cost category** required FK. Server validates the target is not
  deleted.
- **Basis** required enum, defaults to `flat`.
- **Default value** stored as integer, scaled by 100 from the decimal
  form input. Modal flips between "%" and "A$" labels based on basis.
  Zod schema rejects percentage values above 100.
- **CanBeOverridden** boolean. Default true. Says whether the Room
  module may store a per-room amount instead of using the default.
- **IsActive** boolean (Status). Default true. Inactive rows still
  show on the Settings page but should be hidden from selectors on
  bookings and rooms.
- Soft delete; in-use guard plugs in when the booking cost allocation
  table lands.
- Audit log fires on create / update / delete (`entity_type =
  cost_type`).

## Open questions

- **Add/Deduct exclusivity** (formerly two flags) was removed during
  the swap. If the business needs to distinguish additions from
  deductions later, reintroduce a `cost_kind` enum rather than two
  booleans.
- **In-use guard** is vacuous - no allocation table yet.

## Note for the Room module

The **IsOverridden + amount-override** mechanism (per-room rate
instead of `default_value_int`) lives in the Room module, not here.
Read `can_be_overridden` from `cost_types` to decide whether a room
may store its own value. If not overridden, apply `default_value_int`
directly.
