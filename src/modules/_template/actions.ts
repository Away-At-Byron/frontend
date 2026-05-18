"use server"

/**
 * Canonical server-action shape. Copy this pattern in every module.
 * Order is non-negotiable (CLAUDE.md):
 *   schema → withTenant → withPermission → parse → work → audit → tagged result
 */
import { withTenant, withPermission } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult } from "@/lib/result"
import { createExampleSchema, type CreateExampleInput } from "./schemas"
import { EXAMPLE_PERMISSIONS } from "./permissions"

export async function createExample(
  input: CreateExampleInput,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (_tx, ctx) =>
    withPermission(EXAMPLE_PERMISSIONS.create, ctx, async () => {
      const parsed = createExampleSchema.safeParse(input)
      if (!parsed.success) {
        return err("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors)
      }

      // …business logic against `_tx` (RLS GUCs are set on this tx)…
      const id = crypto.randomUUID()

      await writeAudit({
        ctx,
        entityType: "example",
        entityId: id,
        action: "create",
        newValue: parsed.data,
      })
      return ok({ id })
    }),
  )
}
