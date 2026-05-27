/** Shared guest-type DTO - client-safe (no Drizzle imports). */
export type GuestTypeRow = {
  id: string
  name: string
  /** Contacts currently pointing at this guest type. */
  contactCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
