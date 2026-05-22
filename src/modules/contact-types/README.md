# Contact Types

**FRS:** §6.4 Contacts (admin-managed contact type catalogue)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `contact_types` catalogue — the categories a contact
can be filed under (Guest, Owner, Travel Agent, etc). The catalogue replaces
the old `contact_type` enum so the list is editable without a migration
(ADR-006, see `src/db/schema/contact-types.ts`).

## Tables

- `contact_types` — global (not property-scoped). Created by migration
  `0009_contacts_restructure.sql`; no schema change in this module.

## Routes

- `/settings/contact-types` — list, create, edit, delete. Admin role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` at the boundary
  (`adminOnly` gate) — the UI guard is UX only.

## Behaviour

- Names are unique among active types (case-insensitive), enforced in the
  server actions — there is no DB unique constraint.
- Delete is a **soft delete** (`is_deleted = true`). Historical
  `contacts.contact_type_id` references stay intact; the contact list still
  resolves the name via its left join.
- Audit log fires on create / update / delete (`entity_type = contact_type`).

## Open questions

- No DB unique index on `contact_types.name`. If concurrent creates become a
  concern, add a partial unique index on `lower(name) WHERE is_deleted =
  false` and catch `23505` in the actions.
