import type { TariffTraffic } from "./schemas"

/** Shared tariff DTO - client-safe (no Drizzle imports). */
export type TariffRow = {
  id: string
  name: string
  traffic: TariffTraffic
  /** Rate plans currently pointing at this tariff. Always 0 until rate_plans lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
