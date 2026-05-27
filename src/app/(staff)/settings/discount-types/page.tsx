/**
 * Settings > Discount Types - admin-managed discount catalogue.
 * Global, follows ADR-007. Live status (active/scheduled/expired) is
 * computed server-side.
 */
import { assertAdmin } from "@/lib/access"
import { listDiscountTypes } from "@/modules/discount-types/queries"
import { DiscountTypeManagement } from "@/modules/discount-types/components/discount-type-management"

export default async function DiscountTypesPage() {
  await assertAdmin()

  const res = await listDiscountTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load discount types. {res.error.message}
      </div>
    )
  }

  return <DiscountTypeManagement initialDiscounts={res.data} />
}
