/** Shared discount-type DTO - client-safe (no Drizzle imports). */
export type DiscountKind = "percentage" | "flat" | "cashback"
export type DiscountActivationMode = "duration" | "manual"
export type DiscountStatus = "active" | "scheduled" | "expired" | "paused"

export type DiscountTypeRow = {
  id: string
  name: string
  code: string
  description: string | null
  type: DiscountKind
  /** Cents for flat/cashback. Basis points 0..10000 for percentage. */
  valueInt: number
  maxDiscountCents: number | null
  durationStart: string | null
  durationEnd: string | null
  activationMode: DiscountActivationMode
  minAmountCents: number | null
  minNights: number | null
  stackable: boolean
  /** Server-computed live status. Not stored. */
  status: DiscountStatus
  createdAt: Date | string
  updatedAt: Date | string
}
