import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

/** Default rate in dollars (decimal). Empty string becomes 0. */
const defaultRate = z
  .union([
    z.literal("").transform(() => 0),
    z.coerce.number().min(0, "0 or higher"),
  ])
  .optional()
  .transform((v) => (v === undefined ? 0 : v))

const shape = {
  name,
  defaultRate,
  canOverridden: z.coerce.boolean(),
  isDeduction: z.coerce.boolean(),
  isAddition: z.coerce.boolean(),
}

export const createCostTypeSchema = z.object(shape)
export const updateCostTypeSchema = z.object(shape)

export type CreateCostTypeInput = z.infer<typeof createCostTypeSchema>
export type UpdateCostTypeInput = z.infer<typeof updateCostTypeSchema>
