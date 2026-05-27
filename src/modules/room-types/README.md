# Room Types

**FRS:** §3 dictionary ("Category → Room Type") + Layer 1 reference data
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `room_types` catalogue - the categories a room can
be filed under (Studio, Apartment, Cottage, Villa, etc). Global, not
tenanted (ADR-007).

## Tables

- `room_types` - global. Created by migration `0017_room_types.sql`, which
  also seeds the initial 7 names from Jenny's current RMS Cloud setup.

## Routes

- `/settings/room-types` - list, create, edit, delete. Admin role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` at the boundary
  (`adminOnly` gate) - the UI guard is UX only.

## Behaviour

- Names are unique among active types (case-insensitive), enforced in the
  server actions - there is no DB unique constraint.
- `default_max_occupancy` is optional (nullable smallint, 1-32). Admin
  only fills it in when the booking form should pre-fill capacity; the
  per-room override lives on the `rooms` row.
- Delete is a **soft delete** (`is_deleted = true`). Historical
  `rooms.room_type_id` references stay intact once module 6 (rooms) lands.
- Audit log fires on create / update / delete (`entity_type = room_type`).

## Open questions

- **In-use guard** is currently vacuous - `rooms` table does not exist
  yet. When module 6 lands, the delete action should block when any
  `rooms.room_type_id = id` row exists (and `listRoomTypes` should expose
  a real count via leftJoin).
- No DB unique index on `room_types.name`. If concurrent creates become
  a concern, add a partial unique index on `lower(name) WHERE is_deleted
  = false` and catch `23505` in the actions (mirroring the contact_types
  open question).
