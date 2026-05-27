/** Shared room-amenity DTO - client-safe (no Drizzle imports). */
export type RoomAmenityRow = {
  id: string
  name: string
  /** Rooms currently pointing at this amenity. Always 0 until the assignment table lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
