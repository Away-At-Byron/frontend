/** Shared cost-type DTO - client-safe (no Drizzle imports). */
export type CostTypeRow = {
  id: string
  name: string
  /** Default rate in cents. */
  defaultRateCents: number
  canOverridden: boolean
  isDeduction: boolean
  isAddition: boolean
  /** Bookings currently using this cost. Always 0 until the booking cost allocation table lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
