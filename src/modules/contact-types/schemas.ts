import { z } from "zod"

/** The only editable field on the contact-type catalogue. */
const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createContactTypeSchema = z.object({ name })
export const updateContactTypeSchema = z.object({ name })

export type CreateContactTypeInput = z.infer<typeof createContactTypeSchema>
export type UpdateContactTypeInput = z.infer<typeof updateContactTypeSchema>
