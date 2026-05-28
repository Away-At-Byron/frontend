# Tariff Periods

**FRS:** §6.10 Tariffs (admin-managed tariff period catalogue)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `tariff_periods` catalogue — labelled date ranges
(Peak 2026, Winter Off-Peak, …) that future rate plans will attach prices
to. Global, follows ADR-007. Same shape as the contact-types catalogue.

## Tables

- `tariff_periods` — global (not property-scoped). Created by migration
  `0030_tariff_periods.sql`.

## Routes

- `/settings/tariff-periods` — list, create, edit, delete. Admin role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` at the boundary
  (`adminOnly` gate) — the UI guard is UX only.

## Behaviour

- Codes are unique among active periods (case-insensitive). Enforced in
  the server actions and by the partial unique index on
  `lower(code) WHERE is_deleted = false`.
- `to_date >= from_date` is enforced at the schema (CHECK constraint) and
  in the Zod schema.
- Delete is a **soft delete** (`is_deleted = true`).
- Audit log fires on create / update / delete (`entity_type = tariff_period`).
