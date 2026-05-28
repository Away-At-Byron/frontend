/** Shared cost-type DTO — client-safe (no Drizzle imports). */
export type CostBasis =
  | "flat"
  | "per_night"
  | "per_person"
  | "per_room"
  | "percentage"

export type CostTypeRow = {
  id: string
  name: string
  costCategoryId: string
  costCategoryName: string
  basis: CostBasis
  /**
   * Default amount stored as int. Cents for non-percentage bases; basis
   * points 0..10000 for percentage. Rooms read this when applying the cost
   * (and may override it when `canBeOverridden` is true, in the Room module).
   */
  defaultValueInt: number
  canBeOverridden: boolean
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export type Option = { id: string; name: string }
