/**
 * Settings > Cost Categories - admin-managed cost buckets (just a name).
 * Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import { listCostCategories } from "@/modules/cost-categories/queries"
import { CostCategoryManagement } from "@/modules/cost-categories/components/cost-category-management"

export default async function CostCategoriesPage() {
  await assertAdmin()

  const res = await listCostCategories()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load cost categories. {res.error.message}
      </div>
    )
  }

  return <CostCategoryManagement initialCategories={res.data} />
}
