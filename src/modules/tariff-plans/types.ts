/** Shared tariff-plan DTO - client-safe (no Drizzle imports). */
export type TariffStatus = "active" | "inactive"

export type TariffPlanRow = {
  id: string
  name: string
  code: string
  tariffBeginningPriceId: string
  tariffBeginningPriceName: string
  propertyId: string
  /** Resolved at read time from the properties table. Null if the uuid no longer matches a property. */
  propertyName: string | null
  roomTypeId: string
  roomTypeName: string
  status: TariffStatus
  createdAt: Date | string
  updatedAt: Date | string
}

/** Lightweight option used by the modal dropdowns. */
export type Option = { id: string; name: string }
