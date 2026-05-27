/**
 * Settings > Booking Charges - admin-managed catalogue of charge items
 * that can be added to an invoice. Internal table name is `charge_types`
 * to avoid collision with the Layer 3 `booking_charges` table.
 */
import { assertAdmin } from "@/lib/access"
import { listChargeTypes } from "@/modules/charge-types/queries"
import { ChargeTypeManagement } from "@/modules/charge-types/components/charge-type-management"

export default async function ChargeTypesPage() {
  await assertAdmin()

  const res = await listChargeTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load booking charges. {res.error.message}
      </div>
    )
  }

  return <ChargeTypeManagement initialCharges={res.data} />
}
