# Room Amenities

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `room_amenities` catalogue - the per-room amenity
list (Smart TV, Air Conditioning, Balcony, …). Distinct from
`property_amenities`, which sits at the property level. Name-only.

## Tables

- `room_amenities` - global. Created and seeded by migration
  `0020_room_amenities.sql`. Global table follows the precedent in
  ADR-007.

## Routes

- `/settings/room-amenities` - list, create, edit, delete. Admin role only.

## Behaviour

- Names unique among active rows (case-insensitive), enforced in actions.
- Soft delete; in-use guard activates when the room amenity assignment
  table lands.
- Audit fires on create / update / delete (`entity_type =
  room_amenity`).

## Open questions

- **In-use guard** is vacuous - no assignment table yet. When module 6
  (rooms) lands, the delete action should block when referenced.
