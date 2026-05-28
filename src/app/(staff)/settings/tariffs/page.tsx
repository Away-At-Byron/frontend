/**
 * Settings > Tariff Type - admin-managed tariff (rate label)
 * catalogue. Global, follows ADR-007. Distinct from the future rate_plans
 * table which will carry actual prices.
 */
import { assertAdmin } from "@/lib/access"
import { listTariffs } from "@/modules/tariffs/queries"
import { TariffManagement } from "@/modules/tariffs/components/tariff-management"

export default async function TariffsPage() {
  await assertAdmin()

  const res = await listTariffs()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load tariffs. {res.error.message}
      </div>
    )
  }

  return <TariffManagement initialTariffs={res.data} />
}
