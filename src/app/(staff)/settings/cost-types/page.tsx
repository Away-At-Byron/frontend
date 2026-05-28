/**
 * Settings > Cost Types - admin-managed cost catalogue with category,
 * basis, default value and override flag. Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import {
  listCostTypes,
  listCostCategoryOptions,
} from "@/modules/cost-types/queries"
import { CostTypeManagement } from "@/modules/cost-types/components/cost-type-management"

export default async function CostTypesPage() {
  await assertAdmin()

  const [types, categories] = await Promise.all([
    listCostTypes(),
    listCostCategoryOptions(),
  ])
  if (!types.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load cost types. {types.error.message}
      </div>
    )
  }
  if (!categories.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load cost categories. {categories.error.message}
      </div>
    )
  }

  return (
    <CostTypeManagement
      initialCostTypes={types.data}
      costCategoryOptions={categories.data}
    />
  )
}
