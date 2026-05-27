import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createGuestTypeSchema = z.object({ name })
export const updateGuestTypeSchema = z.object({ name })

export type CreateGuestTypeInput = z.infer<typeof createGuestTypeSchema>
export type UpdateGuestTypeInput = z.infer<typeof updateGuestTypeSchema>
