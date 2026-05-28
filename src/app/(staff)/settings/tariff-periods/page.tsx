/**
 * Settings > Tariff Periods — admin-managed catalogue of labelled date
 * ranges that future rate plans attach prices to.
 */
import { assertAdmin } from "@/lib/access"
import { listTariffPeriods } from "@/modules/tariff-periods/queries"
import { TariffPeriodManagement } from "@/modules/tariff-periods/components/tariff-period-management"

export default async function TariffPeriodsPage() {
  await assertAdmin()

  const res = await listTariffPeriods()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load tariff periods. {res.error.message}
      </div>
    )
  }

  return <TariffPeriodManagement initialPeriods={res.data} />
}
