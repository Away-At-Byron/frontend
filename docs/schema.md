# Database schema

Drizzle definitions for the full client data model, in build order. Layer 0
has no deps; each layer depends only on lower layers. This is the order
Claude Code adds tables and migrations are generated.

> The verbatim baselined schema.md (with every column, index and RLS policy
> per table) is the authoritative source — paste it here to replace this
> reference. Layer 0 is already implemented in `src/db/schema/`.

## Conventions
`tenantCols` helper (`src/db/schema/_helpers.ts`): id, property_id (FK, RLS
gate), created_at, updated_at, created_by. Money = `integer` cents. Calendar
days = `date`. Country = `char(2)`. FK gets an index; date columns used in
WHERE get an index. RLS policy added in the same migration as the table.

## Layers
- **0 Foundation** — properties, roles, users(+sessions, password_resets), audit_log ✅ implemented
- **1 Reference** — contacts, room_types, rooms(+history), common_areas(+tasks), booking_sources, channel_mappings, rate_plans(+cancellation_policies), daily_rates, costs, inventory_items(+movements)
- **2 Booking core** — bookings, booking_rooms, booking_guests + gist exclusion constraint (no overlapping room/date)
- **3 Money** — booking_charges, payments, invoices, invoice_lines, booking_cost_allocations
- **4 Operations** — housekeeping_tasks, maintenance_jobs, communications
- **5 Background/read** — night_audits + materialised views

## Migration order
`0000_auth_foundation` ✅ → `0001_contacts` → `0002_property_setup` →
`0003_distribution` → `0004_rates` → `0005_costs_inventory` →
`0006_bookings` → `0007_money` → `0008_operations` →
`0009_audit_background` → `0010_rls_policies` → `0011_materialized_views`.
Migrations are append-only after merge; fix forward.

## RLS pattern (added in 0010 for every tenanted table)
```sql
ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON <t> FOR ALL
  USING  (current_setting('app.role',true)='admin'
          OR property_id = current_setting('app.property_id',true)::uuid)
  WITH CHECK (current_setting('app.role',true)='admin'
          OR property_id = current_setting('app.property_id',true)::uuid);
```
Cross-tenant isolation test lives in `src/modules/properties/tests/rls.test.ts`
and runs in CI on every PR.
