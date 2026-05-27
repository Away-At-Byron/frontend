/**
 * Settings > Cost Types - admin-managed cost catalogue with default rate
 * and addition/deduction/override flags. Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import { listCostTypes } from "@/modules/cost-types/queries"
import { CostTypeManagement } from "@/modules/cost-types/components/cost-type-management"

export default async function CostTypesPage() {
  await assertAdmin()

  const res = await listCostTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load cost types. {res.error.message}
      </div>
    )
  }

  return <CostTypeManagement initialCostTypes={res.data} />
}
