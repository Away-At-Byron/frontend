/** Shared contact-source DTO — client-safe (no Drizzle imports). */
export type ContactSourceRow = {
  id: string
  name: string
  /** Contacts currently pointing at this source. */
  contactCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
