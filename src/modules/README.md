# Modules

One folder per FRS module. Same shape every time so any dev — and Claude
Code — knows exactly where to look. This convention is what keeps three
developers out of each other's merge path.

## Adding a module

1. Find its section in `docs/frs-v0.2.md` (the spec).
2. Find its layer/stage in `docs/development-plan.md` (when it gets built).
3. Find its tables in `docs/schema.md` (what to add to `src/db/schema`).
4. `cp -r src/modules/_template src/modules/<name>` and fill it in.
5. Implement in this order: `schemas.ts → queries.ts → actions.ts → components → tests`.
6. Open the PR with a `[<name>]` title prefix.

## Folder shape

```
src/modules/<name>/
├── actions.ts        # server actions (mutations) — "use server"
├── queries.ts        # read-side queries
├── schemas.ts        # Zod schemas, imported by BOTH server action and React form
├── permissions.ts    # permission codes this module checks
├── components/        # React components used only by this module's pages
├── jobs.ts            # pg-boss handlers (if any)
├── tests/             # acceptance criteria from the FRS
└── README.md          # links the FRS section, lists open questions
```

## Conflict-free ownership (docs/development-plan.md)

Writes stay in lanes; reads cross freely. Dev B and Dev C never write the
same tables.

| Dev | Default modules | Owns DB writes for |
|-----|-----------------|--------------------|
| **A** (infra) | Auth, schema/migrations, RLS, Night Audit, Reports, CI/CD, VPS | `users`, `audit_log`, materialised views |
| **B** (txn) | Bookings, Charges, Payments, Invoices, Availability, Quote | `bookings*`, `*_charges`, `payments`, `invoices` |
| **C** (UI/config) | Contacts, Rooms/Property setup, Housekeeping, Maintenance, Comms | `contacts`, `rooms`, `room_types`, `housekeeping*` |

## Migration numbering (avoids the #1 source of conflicts)

Generate migrations off your owned schema only. Number prefixes by owner so
two devs never collide on the same file:

- Dev A: `0xxx` (foundation) and `1xxx` (infra/background)
- Dev B: `2xxx` (booking + money)
- Dev C: `3xxx` (reference data + operations)

Before editing shared schema (`_helpers.ts`, `index.ts`, `properties`,
`users`), drop a one-line heads-up in the team channel first.
