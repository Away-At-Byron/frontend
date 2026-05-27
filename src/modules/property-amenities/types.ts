/** Shared property-amenity DTO - client-safe (no Drizzle imports). */
export type PropertyAmenityRow = {
  id: string
  category: string
  name: string
  sortOrder: number
  /** Properties currently pointing at this amenity. Always 0 until the assignment table lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
