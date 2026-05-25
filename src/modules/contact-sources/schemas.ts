import { z } from "zod"

/** The only editable field on the contact-source catalogue. */
const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createContactSourceSchema = z.object({ name })
export const updateContactSourceSchema = z.object({ name })

export type CreateContactSourceInput = z.infer<typeof createContactSourceSchema>
export type UpdateContactSourceInput = z.infer<typeof updateContactSourceSchema>
