/** Shared contact-type DTO — client-safe (no Drizzle imports). */
export type ContactTypeRow = {
  id: string
  name: string
  /** Contacts currently pointing at this type. */
  contactCount: number
  createdAt: Date | string
  updatedAt: Date | string
}
