/** Shared tariff-period DTO — client-safe (no Drizzle imports). */
export type TariffPeriodRow = {
  id: string
  code: string
  description: string | null
  /** ISO date strings (yyyy-mm-dd) — what Postgres `date` returns. */
  fromDate: string
  toDate: string
  createdAt: Date | string
  updatedAt: Date | string
}
