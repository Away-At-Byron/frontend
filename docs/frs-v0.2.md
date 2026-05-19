# Functional Requirements Spec (v0.2)

**Project:** Away at Byron Bay multi-property PMS
**Scope:** v1, functional replacement on all three guesthouses
**Status:** Tech stack locked, client data model adopted, ready to drive ClickUp task generation
**Supersedes:** v0.1 (which used my own naming and data model)

---

## 1. What changed in v0.2

We now have the client's data model in writing and the UI work has already started in Moqups. The v0.1 FRS made assumptions in good faith that turned out to differ from the client. This rewrite adopts the client's naming and tables wherever they exist, and adds the modules I had missed.

**Naming corrections throughout:**

| v0.1 (my draft) | v0.2 (client's terms) |
|---|---|
| Reservation | Booking |
| Category | Room Type |
| Area | Room |
| Guest | Contact (with Contact Type) |
| Settings (generic) | Direct tables per concept |

**Modules added because the client listed them:** Contacts (unified people record), Common Areas, Inventory, Costs (configurable cost catalog), Booking Cost Allocation, Communication Log, Channel Mapping (schema only in v1), Daily Rates, BookingGuests + BookingRoom.

**Scope notes:**
- Channel Mapping is v1 schema and CRUD only. OTA sync is Phase 2.
- Timesheets are an integration, not a build. PMS stores `timesheet_id` refs and exposes two integration endpoints.
- Group bookings are v1. `BookingGuests` and `BookingRoom` are first-class from day one.
- Communication Log is v1 (logging only). Trigger automation FSM is Phase 2.

**Timeline.** 26 modules. Build estimate 13–14 weeks.

> Full module specs (§6.1–§6.26), cross-cutting concerns (§7), out-of-scope
> (§8), Moqups mapping (§9) and glossary (§10) are reproduced from the
> baselined v0.2 source. This in-repo copy is authoritative per CLAUDE.md
> rule 1. The complete data model lives in `docs/schema.md`; the build order
> and parallel-work split in `docs/development-plan.md`.

## 2. Tech stack (locked)

Bun · Next.js 16 App Router (route handlers + server actions) · PostgreSQL 16
· Drizzle · Auth.js v5 · pg-boss · Postmark/Postal · Twilio (Phase 2) · Zod
· shadcn/Tailwind/Radix · TanStack Table · React Hook Form + Zod · Recharts ·
MinIO · Dokploy on Hetzner CPX31.

## 3. Design system (locked, supplied by client)

"Editorial Sunrise" — see ADR-002 and `src/styles/globals.css`. Brand teal,
sunrise blush, pandanus ink. Fraunces (display) + Inter (UI). Originals in
`docs/design-reference/`.

## 4. Conventions

Every table: `id uuid pk`, `property_id uuid not null` (RLS gate, except auth
tables), `created_at`, `updated_at`, `created_by`. Money is integer cents.
Calendar dates use `date` not `timestamp`. Server actions return
`{ ok:true, data }` or `{ ok:false, error:{ code,message,fields? } }`. Every
state-changing action writes `audit_log`. Every input parsed by a Zod schema
shared with the React form. Module 3 "Users + Roles": six roles with a
static code-owned module default per role, plus admin-set per-user
overrides (table `user_module_access`) — see ADR-003. Action-level RBAC
stays static and authoritative (§6.3 AC5 unchanged); module access is the
UX-visibility/route-reachability layer only.

## 5. Module index

| # | Module | Layer | # | Module | Layer |
|---|---|---|---|---|---|
| 1 | Auth | 0 | 14 | Availability | 2 |
| 2 | Properties | 0 | 15 | Quote | 2 |
| 3 | Users + Roles | 0 | 16 | Bookings (+Guests/Rooms) | 2 |
| 4 | Contacts | 1 | 17 | Booking Charges | 3 |
| 5 | Room Types | 1 | 18 | Payments | 3 |
| 6 | Rooms | 1 | 19 | Invoices | 3 |
| 7 | Common Areas | 1 | 20 | Booking Cost Allocation | 3 |
| 8 | Booking Sources | 1 | 21 | In/Out Movements | 4 |
| 9 | Channel Mapping | 1 | 22 | Housekeeping | 4 |
| 10 | Rate Plans | 1 | 23 | Maintenance | 4 |
| 11 | Daily Rates | 1 | 24 | Communication Log | 4 |
| 12 | Costs | 1 | 25 | Night Audit | 5 |
| 13 | Inventory | 1 | 26 | Reports + Dashboard | 5 |

Cross-cutting: Audit Log, Timesheet integration.

## 6–10

Module specs, acceptance criteria, edge cases, cross-cutting concerns,
out-of-scope list, Moqups mapping and glossary are the baselined v0.2
content. Data model per module: `docs/schema.md`. Acceptance criteria become
the test cases (CLAUDE.md rule 8). When implementing a module, read its §6.x
section, its `docs/schema.md` tables, and its Stage in
`docs/development-plan.md`.

**Out of scope for v1:** channel sync, Stripe real processing, Monitored
Triggers FSM, Tariff Manager visual calendar, POS Lite, multi-currency,
Xero export, SMS automation.
