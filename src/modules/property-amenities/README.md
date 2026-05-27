# Property Amenities

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the `property_amenities` catalogue - the
category-grouped list of amenities (Connectivity / WiFi, Kitchen /
Microwave, …). Single global table per ADR-009.

## Tables

- `property_amenities` - global. Created and seeded by migration
  `0019_property_amenities.sql` (~85 entries across 15 categories).
- `category` is a text column, not a separate categories table. The UI
  offers a combobox of distinct existing values from the catalogue.

## Routes

- `/settings/property-amenities` - list, create, edit, delete, reorder.
  Admin role only.

## Access

- Page guarded by `assertAdmin()`.
- Every server action re-checks `ctx.role === "admin"` (`adminOnly` gate).

## Behaviour

- `(category, name)` is unique among active rows, case-insensitive on
  both - enforced in server actions, no DB unique constraint.
- **Sort order is server-managed.**
  - New rows go to the end of the chosen category
    (`MAX(sort_order) + 1`).
  - The list page has inline Up / Down buttons per row that call
    `reorderPropertyAmenity(id, "up" | "down")`. The action swaps with
    the neighbour and then renormalises the category to 0..N-1 so the
    values stay tight.
  - Changing a row's category in the edit modal sends it to the end of
    the new category and renormalises both the old and new categories.
- Delete is a **soft delete**; in-use guard plugs in when the property
  or room amenity assignment table lands.
- Audit log fires on create / update / delete (`entity_type =
  property_amenity`). Reorder is not audited - it is a UX-only operation
  on derived state.

## Open questions

- **In-use guard** is currently vacuous - no assignment table yet. When
  it lands, the delete action should block when any active assignment
  references the amenity, and `listPropertyAmenities` should expose a
  real `usageCount` via leftJoin.
- **Renaming a category** is a multi-row update if done via the modal
  (you edit each row that shares the category). v2 may extract
  categories into their own table; see ADR-009.
