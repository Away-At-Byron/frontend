import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "@/lib/env"
import * as schema from "./schema"

declare global {
  // Reuse the pool across HMR reloads in dev. `var` is required for
  // global augmentation; it is a type-only declaration here.
  var __aab_pool: Pool | undefined
}

const pool =
  global.__aab_pool ??
  new Pool({ connectionString: env.DATABASE_URL, max: 10 })

if (process.env.NODE_ENV !== "production") global.__aab_pool = pool

export const db = drizzle(pool, { schema })
export { pool }
