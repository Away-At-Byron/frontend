/**
 * Development seed — Layer 0 only (Stage 0). Idempotent: running twice
 * leaves the same database. Later stages extend this with reference data,
 * bookings, etc. (see docs/schema.md "Seed data").
 *
 *   bun db:seed
 */
import { loadEnvFiles } from "../../lib/load-env-files";

loadEnvFiles();

import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../index";
import { properties, roles, users, contacts } from "../schema";
import { ROLE_NAMES } from "../../lib/modules";

// Roles dropped in the move to the 6-group model (ADR-003). Any user still
// on one of these is remapped before the role is deleted.
const ROLE_REMAP: Record<string, string> = {
  front_desk: "staff",
  accounts: "manager",
};

const PROPERTIES = [
  { name: "Away at Byron Bay", colour: "#9DC9C4", suburb: "Byron Bay" },
  { name: "Away on Shirley Lane", colour: "#C77E63", suburb: "Byron Bay" },
  { name: "Unwind Guesthouse", colour: "#E6D4B7", suburb: "Byron Bay" },
];

async function main() {
  console.log("Seeding Layer 0…");

  // Roles — the 6 groups. Module access per role is a static code map
  // (src/lib/modules.ts → ROLE_DEFAULTS); roles.permission_set is unused.
  for (const name of ROLE_NAMES) {
    await db
      .insert(roles)
      .values({ name })
      .onConflictDoNothing({ target: roles.name });
  }

  // Remap any users on a retired role, then drop the retired roles.
  const all = await db.select().from(roles);
  const byName = new Map(all.map((r) => [r.name, r]));
  for (const [from, to] of Object.entries(ROLE_REMAP)) {
    const fromRole = byName.get(from);
    const toRole = byName.get(to);
    if (fromRole && toRole) {
      await db
        .update(users)
        .set({ roleId: toRole.id })
        .where(eq(users.roleId, fromRole.id));
    }
  }
  const retired = Object.keys(ROLE_REMAP);
  if (retired.length) {
    await db.delete(roles).where(inArray(roles.name, retired));
  }

  const roleRows = await db.select().from(roles);
  const adminRole = roleRows.find((r) => r.name === "admin")!;
  const mgrRole = roleRows.find((r) => r.name === "manager")!;

  // Properties
  for (const p of PROPERTIES) {
    const existing = await db
      .select()
      .from(properties)
      .where(eq(properties.name, p.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(properties).values({
        name: p.name,
        addressSuburb: p.suburb,
        addressCountry: "AU",
        propertyColour: p.colour,
        timezone: "Australia/Sydney",
        currency: "AUD",
        gstRateBp: 1000,
      });
    }
  }
  const propRows = await db.select().from(properties);

  // Users — 1 admin (cross-property) + 1 manager per property.
  const pw = await bcrypt.hash("Away123!", 10);
  const seedUsers: (typeof users.$inferInsert)[] = [
    {
      firstName: "System",
      lastName: "Admin",
      email: "system@awayatbyronbay.com.au",
      passwordHash: pw,
      roleId: adminRole.id,
      propertyId: null,
    },
    {
      firstName: "Jenny",
      lastName: "Junker",
      email: "jenny@awayatbyron.com",
      passwordHash: pw,
      roleId: adminRole.id,
      propertyId: null,
    },
    ...propRows.map((p, i) => ({
      firstName: ["Mary", "Renato", "Sam"][i] ?? "Manager",
      lastName: "Manager",
      email: `manager${i + 1}@awayatbyron.com`,
      passwordHash: pw,
      roleId: mgrRole.id,
      propertyId: p.id,
    })),
  ];
  for (const u of seedUsers) {
    await db
      .insert(users)
      .values(u)
      .onConflictDoNothing({ target: users.email });
  }

  console.log("Seeded users (password: Away123!):");
  for (const u of seedUsers) console.log(`  ${u.email}`);

  // Layer 1 — sample contacts per property (Lucid fields, not mockup names).
  const now = new Date();
  const month = now.getMonth();
  for (const p of propRows) {
    const existing = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.propertyId, p.id))
      .limit(1);
    if (existing.length > 0) continue;

    const samples = [
      {
        clientNumber: "G-1001",
        clientSeq: 1,
        firstName: "Sample",
        lastName: "Guest",
        email: `guest1@${p.name.replace(/\s+/g, "").toLowerCase()}.local`,
        phone: "+61 400 000 001",
        returningGuest: true,
        isVip: false,
        birthday: new Date(now.getFullYear(), month, 12),
      },
      {
        clientNumber: "G-1002",
        clientSeq: 2,
        firstName: "VIP",
        lastName: "Guest",
        email: `vip@${p.name.replace(/\s+/g, "").toLowerCase()}.local`,
        returningGuest: true,
        isVip: true,
        birthday: new Date(1990, month, 20),
      },
      {
        clientNumber: "G-1003",
        clientSeq: 3,
        firstName: "New",
        lastName: "Guest",
        email: `new@${p.name.replace(/\s+/g, "").toLowerCase()}.local`,
        returningGuest: false,
        isVip: false,
      },
    ];
    for (const s of samples) {
      await db.insert(contacts).values({
        propertyId: p.id,
        contactType: "guest",
        communicationPreference: "email",
        marketingOptIn: false,
        addressCountry: "AU",
        ...s,
      });
    }
  }
  console.log("Seeded sample contacts per property.");

  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
