import "server-only"

/**
 * Read-side queries. Still go through withTenant so RLS GUCs are set —
 * never query tenanted tables with a bare db handle (CLAUDE.md rule 3).
 * Read-only queries return data directly (no audit row needed).
 */
import { withTenant } from "@/lib/rls"
import { ok, type ActionResult } from "@/lib/result"

export async function listExamples(): Promise<ActionResult<unknown[]>> {
  return withTenant(async (_tx) => {
    // const rows = await _tx.select().from(...) ...
    return ok([])
  })
}
