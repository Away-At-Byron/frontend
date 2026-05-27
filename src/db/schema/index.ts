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
export * from "./contact-types" // module 4 — admin-managed contact type catalogue
export * from "./contact-sources" // module 4 — admin-managed contact source catalogue
export * from "./groups" // module 4 — group bookings
export * from "./contacts" // module 4
export * from "./communications" // module 24 — in-portal staff↔contact chat (loaded early because contact-documents FKs it)
export * from "./contact-emails" // module 24 — outbound staff→contact email log (loaded before contact-documents which FKs it)
export * from "./contact-documents" // module 4 — files + comms per contact
export * from "./room-types" // module 5 — admin-managed room type catalogue (global, ADR-007)
export * from "./room-configurations" // module 5 — admin-managed room configuration catalogue (global, ADR-008)
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
// (communications exported above with module 4 to satisfy contact_documents FK ordering)

// ── Layer 5 — background + read (Stage 6) ──────────────────
// export * from "./night-audits"    // module 25
