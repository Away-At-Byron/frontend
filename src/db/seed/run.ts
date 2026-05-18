/**
 * Development seed — Layer 0 only (Stage 0). Idempotent: running twice
 * leaves the same database. Later stages extend this with reference data,
 * bookings, etc. (see docs/schema.md "Seed data").
 *
 *   bun db:seed
 */
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db, pool } from "../index"
import { properties, roles, users } from "../schema"

const ROLE_NAMES = ["admin", "manager", "front_desk", "housekeeper", "accounts"]

const PROPERTIES = [
  { name: "Away at Byron Bay", colour: "#9DC9C4", suburb: "Byron Bay" },
  { name: "Away on Shirley Lane", colour: "#C77E63", suburb: "Byron Bay" },
  { name: "Unwind Guesthouse", colour: "#E6D4B7", suburb: "Byron Bay" },
]

async function main() {
  console.log("Seeding Layer 0…")

  // Roles
  for (const name of ROLE_NAMES) {
    await db.insert(roles).values({ name }).onConflictDoNothing({ target: roles.name })
  }
  const roleRows = await db.select().from(roles)
  const adminRole = roleRows.find((r) => r.name === "admin")!
  const mgrRole = roleRows.find((r) => r.name === "manager")!

  // Properties
  for (const p of PROPERTIES) {
    const existing = await db.select().from(properties).where(eq(properties.name, p.name)).limit(1)
    if (existing.length === 0) {
      await db.insert(properties).values({
        name: p.name,
        addressSuburb: p.suburb,
        addressCountry: "AU",
        propertyColour: p.colour,
        timezone: "Australia/Sydney",
        currency: "AUD",
        gstRateBp: 1000,
      })
    }
  }
  const propRows = await db.select().from(properties)

  // Users — 1 admin (cross-property) + 1 manager per property.
  const pw = await bcrypt.hash("Away123!", 10)
  const seedUsers: (typeof users.$inferInsert)[] = [
    { firstName: "Jenny", lastName: "Junker", email: "jenny@awayatbyron.com", passwordHash: pw, roleId: adminRole.id, propertyId: null },
    ...propRows.map((p, i) => ({
      firstName: ["Mary", "Renato", "Sam"][i] ?? "Manager",
      lastName: "Manager",
      email: `manager${i + 1}@awayatbyron.com`,
      passwordHash: pw,
      roleId: mgrRole.id,
      propertyId: p.id,
    })),
  ]
  for (const u of seedUsers) {
    await db.insert(users).values(u).onConflictDoNothing({ target: users.email })
  }

  console.log("Seeded users (password: Away123!):")
  for (const u of seedUsers) console.log(`  ${u.email}`)
  await pool.end()
}

main().catch(async (e) => {
  console.error(e)
  await pool.end()
  process.exit(1)
})
