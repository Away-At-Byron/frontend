import type { TariffBasis, TariffStatus, TariffTraffic } from "./schemas"

/** Shared tariff DTO - client-safe (no Drizzle imports). */
export type TariffRow = {
  id: string
  name: string
  code: string
  tariffBasis: TariffBasis
  refundable: boolean
  breakfastIncluded: boolean
  traffic: TariffTraffic
  status: TariffStatus
  propertyId: string | null
  /** Resolved at read time. Null when propertyId is null or no longer matches. */
  propertyName: string | null
  roomId: string | null
  tariffPeriodId: string | null
  /** Resolved at read time from `tariff_periods.code`. Null when the period is unset or soft-deleted. */
  tariffPeriodCode: string | null
  /** Rate plans currently pointing at this tariff. Always 0 until rate_plans lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}

/** Lightweight option used by the modal dropdowns. */
export type Option = { id: string; name: string }
