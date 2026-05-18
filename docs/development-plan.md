# Build sequence

Dependency-ordered stages, gates not dates, pull-next-never-wait. Lower
layers before higher; inside a layer, modules build in parallel.

> Authoritative baselined development-plan.md — paste the full version to
> replace this reference. Ownership + migration numbering also in
> `src/modules/README.md`.

## Role defaults (flexible)
- **Dev A** infra: bootstrap, migrations, RLS, CI/CD, VPS, Night Audit, Reports.
- **Dev B** txn: Bookings, Charges, Payments, Invoices, Availability, Quote.
- **Dev C** UI/config: design system, Contacts, Room/Property setup, Housekeeping, Maintenance, Comms.

## Stages
- **0 Bootstrap** ✅ repo runs, hello-world, CI green. (this delivery)
- **1 Foundation (L0)** Auth, Properties, Users+Roles, Audit Log. Gate: cross-tenant RLS test passes; clean 403s; Jenny demo.
- **2 Reference (L1)** Contacts first (everything refs it), then Room Types→Rooms, Booking Sources, Rate Plans→Daily Rates, Costs, Common Areas/Inventory/Channel Mapping. Gate: configure a fresh property end to end.
- **3 Booking core (L2)** Bookings schema + exclusion constraint, Availability, Quote, New Booking form, Calendar. Single-room path proven before group. Gate: take single + group booking, calendar <200ms/1000 rows.
- **4 Money (L3)** Charges → Cost Allocation → Payments → Invoices. AU GST + 28-night concession tested before invoices merge.
- **5 Operations (L4)** check-in/out, In/Out lists, Housekeeping PWA (mobile-first, offline queue), Maintenance, Comms log.
- **6 Background (L5)** Night Audit (idempotent), materialised views, reports + dashboard, CSV/PDF export.
- **7 Hardening** RLS audit, perf budget, integration tests, a11y, bug burn-down.
- **8 Soft launch** Away at Byron Bay only; 50 arrivals no P1 before adding the other two.

## Rituals
15-min standup; PR review within 4 working hours; demo to Jenny at each gate.
No retros/poker/estimation. The plan is this doc; gates are the milestones.
