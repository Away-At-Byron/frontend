# Discount Types

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `discount_types` catalogue - the promo/discount
definitions that a booking can reference. Global; follows ADR-007.

## Tables

- `discount_types` - global. Created by migration
  `0021_discount_types.sql`. No seed - admins create the first rows.
- Two Postgres enums: `discount_type_kind` (percentage / flat / cashback)
  and `discount_activation_mode` (duration / manual).

## Routes

- `/settings/discount-types` - list, create, edit, delete. Admin role
  only.

## Behaviour

- **Code** is required, unique (case-insensitive) among active rows
  (`discount_types_code_active_uq` partial unique index). Format:
  uppercase letters and digits only, no spaces, max 40 chars. The modal
  auto-derives it from the name (strip non-alphanumeric + upper-case)
  unless the admin has edited the field manually.
- **Value storage:** `value_int` is a single integer column. For
  `percentage` it stores basis points 0..10000 (25% = 2500). For `flat`
  and `cashback` it stores cents. CHECK constraints in the migration
  enforce the per-type range. The action layer multiplies the user-typed
  decimal by 100 and rounds to an integer; the modal divides by 100 on
  load.
- **Activation:** `activation_mode = "duration"` means active when
  today is within [duration_start, duration_end] (null bounds are
  open-ended). `activation_mode = "manual"` means active by row
  existence (pause by switching to duration with a past end date or by
  soft-deleting).
- **Live status** (`active` / `scheduled` / `expired` / `paused`) is
  computed in `status.ts` and exposed on the DTO. Not stored.
- **Cashback** behaves identically to flat in v1 - the type label is
  stored so a future payment integration can branch on it.
- Soft delete preserves the FK from any booking that already applied
  the discount.

## Open questions

- **Per-property scope** is global per ADR-007. If the client later
  needs "Shirley Lane only" promos, add `property_id` (nullable) or a
  join table and update this README.
- **Usage tracking** (max_uses_total, max_uses_per_contact) was scoped
  out for v1. Add when bookings + discount application lands.
