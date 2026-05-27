/** Shared cost-category DTO - client-safe (no Drizzle imports). */
export type CostBasis =
  | "flat"
  | "per_night"
  | "per_person"
  | "per_room"
  | "percentage"

export type CostCategoryRow = {
  id: string
  name: string
  costTypeId: string
  costTypeName: string
  /** The parent cost type's default rate (cents). Shown when isOverridden is false. */
  costTypeDefaultRateCents: number
  basis: CostBasis
  /** Cents for non-percentage bases. Basis points 0..10000 for percentage. Only meaningful when isOverridden is true. */
  amountInt: number
  /** When true, use this row's amountInt. When false, inherit costTypeDefaultRateCents. */
  isOverridden: boolean
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export type Option = { id: string; name: string }

/** Cost-type dropdown option carries the default rate so the modal can prefill the amount. */
export type CostTypeOption = Option & { defaultRateCents: number }
