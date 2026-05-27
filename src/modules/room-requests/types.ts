/** Shared room-request DTO - client-safe (no Drizzle imports). */
export type RoomRequestRow = {
  id: string
  name: string
  code: string | null
  /** Bookings currently tagged with this request. Always 0 until the assignment table lands. */
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
