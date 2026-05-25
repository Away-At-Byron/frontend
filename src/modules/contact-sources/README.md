# Contact Sources

**FRS:** §6.4 Contacts (admin-managed contact source catalogue)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `contact_sources` catalogue — how a contact first
reached the business (Website Direct Booking, Phone Enquiry, OTA, etc).
Mirrors the `contact_types` pattern so the list is editable without a
migration (see `src/db/schema/contact-sources.ts`).

## Tables

- `contact_sources` — global (not property-scoped). Created by migration
  `0012_contact_sources.sql`, which also drops the old `contact_source` enum
  and converts `contacts.source` to a FK `contacts.contact_source_id`.

## Routes

- `/settings/contact-sources` — list, create, edit, delete. Admin role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` at the boundary
  (`adminOnly` gate) — the UI guard is UX only.

## Behaviour

- Names are unique among active sources (case-insensitive), enforced in the
  server actions — there is no DB unique constraint.
- Delete is a **soft delete** (`is_deleted = true`). Historical
  `contacts.contact_source_id` references stay intact.
- Audit log fires on create / update / delete (`entity_type = contact_source`).
