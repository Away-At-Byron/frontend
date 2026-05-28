# Cost Categories (`cost_categories`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the cost category catalogue. Just a name. Each
cost_type belongs to exactly one cost_category. User-facing label is
**"Cost Category"**.

## Tables

- `cost_categories` - global (follows ADR-007). Original 0027 migration
  is superseded by `0033_cost_category_type_swap.sql`, which drops both
  cost tables and recreates them in their final shape. Initial rows are
  seeded by that migration: **Housekeeping, Consumables, Linen, Damages**.
- Partial unique index on `lower(name) WHERE is_deleted = false`.

## Routes

- `/settings/cost-categories` - list, create, edit, delete. Admin only.

## Behaviour

- **Name** required, unique (case-insensitive) among active rows. Max
  80 characters.
- Soft delete; blocked while any active cost_type still points at the
  category (the DB FK is ON DELETE RESTRICT but soft delete bypasses
  that, so the action layer enforces the same).
- Audit log fires on create / update / delete (`entity_type =
  cost_category`).

## Open questions

- None right now. The basis / default value / override mechanics moved
  to `cost_types`; this table is intentionally a tiny lookup.
