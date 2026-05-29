/** Shared storage-location DTOs — client-safe (no Drizzle imports). */

export type StorageLocationRow = {
  id: string
  name: string
  /** Number of inventory items currently allocated to this location. */
  itemCount: number
  createdAt: Date | string
  updatedAt: Date | string
}

export type StorageLocationOption = {
  id: string
  name: string
}
