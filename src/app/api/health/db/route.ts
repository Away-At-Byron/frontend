// Readiness — Postgres round-trip. Asserts the pool answers `SELECT 1`.
import { sql } from "drizzle-orm"
import { db } from "@/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({ ok: true, db: "up" })
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 })
  }
}
