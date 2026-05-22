# Contacts (module 4)

**FRS:** §6.4 Contacts  
**Stage:** 2 · Reference data (Layer 1)  
**Owner:** Dev C  

## Tables

- `contacts` — unified people record. **Global, not property-scoped** (ADR-006).
- `contact_types` — admin-managed contact type catalogue (Settings area).
- `groups` — group bookings; one Primary contact books for related contacts.

## Routes

- `/contacts` — list, filter, create, edit (nav label: Guests)

## Commands

```bash
bun drizzle:migrate   # applies 0003 + 0007 + 0009 (contacts)
bun db:seed           # Layer 0 users/properties + sample contacts
```

## Notes for the Booking module

These rules depend on the `bookings` table and are implemented when that
module lands:

1. **Returning Guest** — set `contacts.returning_guest = true` when the
   contact has more than one booking.
2. **Stay Number** — count of the contact's bookings with status
   `Confirmed` (cancelled bookings are not counted). Surfaced as the
   `stayCount` field, currently hardcoded `0`.
3. **Average Stay Duration** — average number of nights per stay across
   the contact's bookings. Computed on read; no stored column.

## Open questions

- Government ID "guests only" is enforced in the server action
  (`assertGuestForId`), not by a DB constraint — `contact_type` is a FK,
  so a `CHECK` cannot inspect the type name. Revisit if the rule needs to
  be tightened.
