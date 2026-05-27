import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

/**
 * Amount in dollars (decimal). Empty string is treated as 0. The action
 * layer multiplies by 100 and rounds to integer cents before storage.
 */
const amount = z
  .union([
    z.literal("").transform(() => 0),
    z.coerce.number().min(0, "0 or higher"),
  ])
  .optional()
  .transform((v) => (v === undefined ? 0 : v))

export const createChargeTypeSchema = z.object({ name, amount })
export const updateChargeTypeSchema = z.object({ name, amount })

export type CreateChargeTypeInput = z.infer<typeof createChargeTypeSchema>
export type UpdateChargeTypeInput = z.infer<typeof updateChargeTypeSchema>
