/**
 * Settings > Tariff - admin-managed catalogue of named tariff plans that
 * bind a tariff label, property, and room type with a status.
 */
import { assertAdmin } from "@/lib/access"
import {
  listTariffPlans,
  listTariffOptions,
  listPropertyOptions,
  listRoomTypeOptions,
} from "@/modules/tariff-plans/queries"
import { TariffPlanManagement } from "@/modules/tariff-plans/components/tariff-plan-management"

export default async function TariffPlansPage() {
  await assertAdmin()

  const [plans, tariffs, propertiesList, roomTypes] = await Promise.all([
    listTariffPlans(),
    listTariffOptions(),
    listPropertyOptions(),
    listRoomTypeOptions(),
  ])

  for (const r of [plans, tariffs, propertiesList, roomTypes]) {
    if (!r.ok) {
      return (
        <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
          Could not load tariffs. {r.error.message}
        </div>
      )
    }
  }

  return (
    <TariffPlanManagement
      initialPlans={plans.ok ? plans.data : []}
      tariffOptions={tariffs.ok ? tariffs.data : []}
      propertyOptions={propertiesList.ok ? propertiesList.data : []}
      roomTypeOptions={roomTypes.ok ? roomTypes.data : []}
    />
  )
}
