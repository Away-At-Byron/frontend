# Booking Charges (`charge_types`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the catalogue of charge items that can be added to an
invoice (Bond, Cleaning Fee, Late Check-Out, …). User-facing label is
**"Booking Charges"**.

**Naming note:** the internal table is `charge_types` to avoid collision
with the Layer 3 `booking_charges` table that records actual charges
applied to bookings. The settings catalogue defines the *types* of
charges; the Layer 3 table records *applied instances*.

## Tables

- `charge_types` - global (follows ADR-007). Created and seeded by
  migration `0023_charge_types.sql` (17 rows from Jenny's spreadsheet).
- `default_amount_cents` is an integer (CLAUDE.md rule 4) with a CHECK
  constraint enforcing `>= 0`.
- Partial unique index on `lower(name) WHERE is_deleted = false` for
  case-insensitive uniqueness among active rows.

## Routes

- `/settings/charge-types` - list, create, edit, delete. Admin role only.

## Behaviour

- **Name** required, unique (case-insensitive) among active rows.
- **Default amount** stored as integer cents. The form takes decimals;
  the action multiplies by 100 and rounds; the modal divides by 100 on
  load.
- Soft delete; in-use guard plugs in when invoice_lines lands.
- Audit log fires on create / update / delete (`entity_type =
  charge_type`).

## Open questions

- **In-use guard** is vacuous - no invoice_lines table yet. When module
  20 (invoices) lands, the delete action should block when any active
  invoice_line references the charge type, and `listChargeTypes` should
  expose a real `usageCount` via leftJoin.
- The seed preserves two oddities from the spreadsheet: "OTA's Agents
  Commision" (likely "Commission") and "toiletries" (lowercase). Admin
  can fix either from the Settings page.
