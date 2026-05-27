# Cost Types (`cost_types`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the cost catalogue. Each row defines a cost item
that can be applied to a booking with a default rate and three flags:
**CanOverridden**, **IsDeduction**, **IsAddition**. Global, follows
ADR-007.

**Naming note:** the internal table is `cost_types` to avoid collision
with the Layer 1 `costs` transactional table planned in the FRS.

## Tables

- `cost_types` - global. Created by migration `0026_cost_types.sql`. No
  seed - admins create rows from the Settings page.
- `default_rate_cents` integer with CHECK >= 0 (CLAUDE.md rule 4).
- Partial unique index on `lower(name) WHERE is_deleted = false`.

## Routes

- `/settings/cost-types` - list, create, edit, delete. Admin role only.

## Behaviour

- **Name** required, unique (case-insensitive) among active rows.
- **Default rate** stored as integer cents. The form takes decimals;
  the action multiplies by 100 and rounds; the modal divides by 100 on
  load.
- **Flag defaults**: canOverridden = true, isAddition = true,
  isDeduction = false. No CHECK constraint enforces addition/deduction
  mutual exclusion - add one if business rules require it.
- Soft delete; in-use guard plugs in when the booking cost allocation
  table lands.
- Audit log fires on create / update / delete (`entity_type =
  cost_type`).

## Open questions

- **Rate kind**: stored as cents only. If a future version needs a
  percentage rate variant (e.g. "OTA Commission: 15% of room revenue"),
  add a `rate_kind` enum + split into `flat_amount_cents` /
  `percentage_bp` columns. Mirrors discount_types ADR.
- **In-use guard** is vacuous - no allocation table yet.
- **Add/Deduct exclusivity** not enforced. Add a CHECK if (isAddition
  AND isDeduction) becomes a real bug.
