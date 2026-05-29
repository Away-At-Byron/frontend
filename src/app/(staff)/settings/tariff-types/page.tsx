/**
 * Settings > Tariff Type (`/settings/tariff-types`) - admin-managed
 * catalogue of named tariff rows. Each row carries a basis
 * (Per Night / Per Week / Long Stay), a refundable + breakfast posture,
 * optional property/room scope, and a status. Tariff period assignment
 * lives on the Rates page (Bulk Update). Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import {
  listTariffs,
  listPropertyOptions,
} from "@/modules/tariffs/queries"
import { TariffManagement } from "@/modules/tariffs/components/tariff-management"

export default async function TariffsPage() {
  await assertAdmin()

  const [tariffs, propertiesList] = await Promise.all([
    listTariffs(),
    listPropertyOptions(),
  ])

  for (const r of [tariffs, propertiesList]) {
    if (!r.ok) {
      return (
        <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
          Could not load tariffs. {r.error.message}
        </div>
      )
    }
  }

  return (
    <TariffManagement
      initialTariffs={tariffs.ok ? tariffs.data : []}
      propertyOptions={propertiesList.ok ? propertiesList.data : []}
    />
  )
}
