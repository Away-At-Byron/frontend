/** Shared room-type DTO - client-safe (no Drizzle imports). */
export type RoomTypeRow = {
  id: string
  name: string
  defaultMaxOccupancy: number | null
  /** Rooms currently pointing at this type. Always 0 until module 6 (rooms) lands. */
  roomCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
