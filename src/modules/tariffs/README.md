# Tariff Beginning Price (`tariffs`)

**FRS:** §3 dictionary (Settings / Direct tables per concept)
**Stage:** 2 · Reference data (Layer 1)
**Owner:** Dev C

Admin-only CRUD for the tariff label catalogue - the starting-rate
categories applied to bookings (Standard Weekday Rate, Peak Season,
Non-Refundable, …). User-facing label is **"Tariff Beginning Price"**.
Name-only.

## Tables

- `tariffs` - global (follows ADR-007). Created and seeded by migration
  `0024_tariffs.sql` (8 default rows).

## Routes

- `/settings/tariffs` - list, create, edit, delete. Admin role only.

## Behaviour

- Name required, unique (case-insensitive) among active rows.
- Soft delete; in-use guard plugs in when rate_plans (FRS Layer 1
  module 10) lands.
- Audit log fires on create / update / delete (`entity_type = tariff`).

## Open questions

- **In-use guard** is vacuous - no rate_plans table yet. When module 10
  lands, the delete action should block when any active rate_plan
  references the tariff, and `listTariffs` should expose a real
  `usageCount` via leftJoin.
- This catalogue is label-only. The future `rate_plans` table will
  carry actual nightly prices, restrictions, and cancellation policies;
  it may or may not FK to `tariffs.id` depending on how the rate plan
  schema lands.
