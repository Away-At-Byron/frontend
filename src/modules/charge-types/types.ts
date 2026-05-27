/** Shared charge-type DTO - client-safe (no Drizzle imports). */
export type ChargeTypeRow = {
  id: string
  name: string
  /** Default amount in cents. */
  defaultAmountCents: number
  /** Invoice lines currently using this charge. Always 0 until invoice_lines lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
