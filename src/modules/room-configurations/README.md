# Room Configurations

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `room_configurations` catalogue - the detailed
layout descriptions assigned to a room (e.g. "King Ensuite, Kitchen, Living"
or "2 King Rooms, Queen Room, 2 Singles / 1 King, 2 Bathrooms"). Global,
not tenanted (ADR-008). Sits one level below room_type on a room.

## Tables

- `room_configurations` - global. Created by migration
  `0018_room_configurations.sql`, which also seeds Jenny's 8 initial
  layouts.

## Routes

- `/settings/room-configurations` - list, create, edit, delete. Admin
  role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` (`adminOnly` gate).

## Behaviour

- Names are unique among active rows (case-insensitive), enforced in the
  server actions - no DB unique constraint.
- Names up to 120 chars (longer than room_types) because layout strings
  can be long.
- `default_max_occupancy` is optional (nullable smallint, 1-32) - admin
  fills it when the booking form should pre-fill capacity.
- Delete is a **soft delete**; in-use guard plugs in when rooms (module
  6) lands.
- Audit log fires on create / update / delete (`entity_type =
  room_configuration`).

## Open questions

- **In-use guard** is currently vacuous - `rooms` table does not exist
  yet. When module 6 lands, the delete action should block when any
  `rooms.room_configuration_id = id` row exists.
