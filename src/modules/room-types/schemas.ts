import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

/**
 * Max occupancy is optional - admin only fills it in when the booking form
 * should pre-fill capacity. Empty string from the form maps to null.
 */
const defaultMaxOccupancy = z
  .union([
    z.literal("").transform(() => null),
    z.coerce
      .number()
      .int("Whole number only")
      .min(1, "At least 1")
      .max(32, "Keep it under 32"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined ? null : v))

export const createRoomTypeSchema = z.object({ name, defaultMaxOccupancy })
export const updateRoomTypeSchema = z.object({ name, defaultMaxOccupancy })

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>
