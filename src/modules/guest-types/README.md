# Guest Types

**FRS:** §6 Contacts (admin-managed guest type catalogue)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `guest_types` catalogue - the guest classification
applied to a contact (Leisure, Corporate, Family, …). Replaces the old
`guest_type` Postgres enum so the list is editable without a migration -
same precedent as `contact_types` and `contact_sources` (ADR-006).

## Tables

- `guest_types` - global, not tenanted. Created and seeded by migration
  `0028_guest_types.sql` with the 7 values from the original enum.
- Migration 0028 also adds `contacts.guest_type_id uuid` (FK to
  guest_types.id), backfills it from the old `guest_type` enum column,
  then drops the column and the enum type.

## Routes

- `/settings/guest-types` - list, create, edit, delete. Admin role only.

## Behaviour

- Names unique among active rows (case-insensitive), enforced in
  actions (no DB unique index, mirroring contact_types).
- Delete is a soft delete - historical `contacts.guest_type_id`
  references stay intact, the contact form still resolves the name
  via leftJoin.
- Audit log fires on create / update / delete (`entity_type =
  guest_type`).

## Integration

- The contact form / contact detail page fetches the live catalogue
  via `listGuestTypes` and renders it as a dropdown. No more hardcoded
  `GUEST_TYPE_LABELS` import.
