/** Shared cost-category DTO — client-safe (no Drizzle imports). */
export type CostCategoryRow = {
  id: string
  name: string
  /** Cost types currently pointing at this category. */
  costTypeCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
