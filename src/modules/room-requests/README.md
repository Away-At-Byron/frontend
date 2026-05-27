# Room Requests

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `room_requests` catalogue - common room
requirements a booking can be tagged with (Early Check-In, Extra Bed,
Late Arrival, …). Global; follows ADR-007.

## Tables

- `room_requests` - global. Created and seeded by migration
  `0022_room_requests.sql` (12 default rows; codes left null).
- Two partial unique indexes on the table:
  - `lower(name) WHERE is_deleted = false` - case-insensitive name
    uniqueness.
  - `lower(code) WHERE is_deleted = false AND code IS NOT NULL` -
    case-insensitive code uniqueness when set.

## Routes

- `/settings/room-requests` - list, create, edit, delete. Admin role
  only.

## Behaviour

- **Name** required, unique (case-insensitive) among active rows.
- **Code** optional. Uppercase letters and digits only, max 40 chars.
  Empty input is normalised to null. The modal sanitises typed input
  live (disallowed chars stripped, lowercase upper-cased).
- Delete is a soft delete; in-use guard plugs in when bookings can be
  tagged with requests.
- Audit log fires on create / update / delete (`entity_type =
  room_request`).

## Open questions

- **In-use guard** is vacuous - no booking_requests assignment table
  yet.
- **Auto-derive code from name** is intentionally off here (the seed
  ships with null codes). Switch it on if Jenny prefers the same
  behaviour as discount_types.
