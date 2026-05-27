# Cost Categories (`cost_categories`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the cost category catalogue. Each row is a named
variant of a Cost Type with its own basis (how the amount is applied)
and amount value. User-facing label is **"Cost Categories"**.

## Tables

- `cost_categories` - global (follows ADR-007). Created by migration
  `0027_cost_categories.sql`. No seed.
- FK to `cost_types.id` (ON DELETE RESTRICT).
- Postgres enum `cost_basis` (`flat | per_night | per_person | per_room
  | percentage`).
- `amount_int` stores **cents** for non-percentage bases and **basis
  points 0..10000** for percentage. CHECK constraint enforces the range
  per basis.
- Partial unique index on `(lower(name), cost_type_id) WHERE
  is_deleted = false` so the same name can exist under different cost
  types.

## Routes

- `/settings/cost-categories` - list, create, edit, delete. Admin only.

## Behaviour

- **Name** required, unique per cost type (case-insensitive) among
  active rows.
- **Cost type** required FK. Server validates the target is not deleted.
- **Basis** required enum, defaults to `flat`.
- **Amount** stored as integer, scaled by 100 from the decimal form
  input. Modal flips between "%" and "A$" labels based on basis. The
  Zod schema rejects percentage values above 100.
- **IsOverridden** boolean (admin can change the amount when applying
  the cost). Default false. The wording mirrors the client's column
  name; behaviour is the same as cost_types.canOverridden.
- **IsActive** boolean. Default true. Inactive rows still show on the
  Settings page but should be hidden from booking selectors.
- Soft delete; in-use guard plugs in when bookings reference categories.
- Audit log fires on create / update / delete (`entity_type =
  cost_category`).

## Open questions

- **IsOverridden interpretation**: read as "admin can override the
  amount" (mirrors `cost_types.canOverridden`). If the client meant
  something else (e.g. "this row overrides the cost type's default
  rate"), update the action and modal copy.
- **In-use guard** is vacuous - no booking cost allocation table yet.
- **Percentage cap on max discount** is not modelled here (unlike
  discount_types). Add when needed.
