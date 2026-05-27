import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createTariffSchema = z.object({ name })
export const updateTariffSchema = z.object({ name })

export type CreateTariffInput = z.infer<typeof createTariffSchema>
export type UpdateTariffInput = z.infer<typeof updateTariffSchema>
