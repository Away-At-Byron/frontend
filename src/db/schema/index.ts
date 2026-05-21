// Re-export every domain schema file so Drizzle Kit sees them all.
// Uncomment each line as the owning module lands its migration
// (build order: docs/schema.md → "Migration order").

export * from "./properties" // Layer 0 — module 2
export * from "./roles" // Layer 0 — module 3
export * from "./auth" // Layer 0 — module 1
export * from "./auth-otps" // Layer 0 — module 1 (shared OTP store)
export * from "./user-access" // Layer 0 — module 3 (per-user module overrides)
export * from "./audit" // Layer 0 — cross-cutting

// ── Layer 1 — domain reference data (Stage 2) ──────────────
export * from "./contacts" // module 4
// export * from "./room-types"      // module 5
// export * from "./rooms"           // module 6
// export * from "./common-areas"    // module 7
// export * from "./booking-sources" // module 8
// export * from "./channel-mappings"// module 9
// export * from "./rate-plans"      // modules 10
// export * from "./daily-rates"     // module 11
// export * from "./costs"           // module 12
// export * from "./inventory"       // module 13

// ── Layer 2 — booking core (Stage 3) ───────────────────────
// export * from "./bookings"        // module 16 (+ booking_rooms, booking_guests)

// ── Layer 3 — money (Stage 4) ──────────────────────────────
// export * from "./financial"       // modules 17–20

// ── Layer 4 — operations (Stage 5) ─────────────────────────
// export * from "./housekeeping"    // module 22
// export * from "./maintenance"     // module 23
// export * from "./communications"  // module 24

// ── Layer 5 — background + read (Stage 6) ──────────────────
// export * from "./night-audits"    // module 25
