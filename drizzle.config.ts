import type { Config } from "drizzle-kit"

// drizzle-kit is a standalone CLI — unlike the Next.js / Bun runtime it does
// NOT auto-load .env files. Load them here (zero-dep, Bun/Node 21+).
// CI sets DATABASE_URL in the real environment, so a missing file is fine.
for (const f of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(f)
  } catch {
    /* file absent (e.g. CI) — env already provided */
  }
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it, " +
      "or export DATABASE_URL before running drizzle-kit.",
  )
}

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
} satisfies Config
