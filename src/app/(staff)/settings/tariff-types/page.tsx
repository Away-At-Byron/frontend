/**
 * Settings > Tariff Type (`/settings/tariff-types`) - admin-managed
 * catalogue of named tariff rows. Each row carries a basis
 * (Per Night / Per Week / Long Stay), a refundable + breakfast posture,
 * optional property/room scope, an optional tariff period, and a
 * status. Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import {
  listTariffs,
  listPropertyOptions,
  listTariffPeriodOptions,
} from "@/modules/tariffs/queries"
import { TariffManagement } from "@/modules/tariffs/components/tariff-management"

export default async function TariffsPage() {
  await assertAdmin()

  const [tariffs, propertiesList, periodsList] = await Promise.all([
    listTariffs(),
    listPropertyOptions(),
    listTariffPeriodOptions(),
  ])

  for (const r of [tariffs, propertiesList, periodsList]) {
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
      tariffPeriodOptions={periodsList.ok ? periodsList.data : []}
    />
  )
}
