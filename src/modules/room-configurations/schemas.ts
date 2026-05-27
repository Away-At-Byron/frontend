import { z } from "zod"

// Layout strings are long ("2 King Rooms, Queen Room, 2 Singles / 1 King,
// 2 Bathrooms" is 56 chars), so allow up to 120.
const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(120, "Keep it under 120 characters")

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

export const createRoomConfigurationSchema = z.object({ name, defaultMaxOccupancy })
export const updateRoomConfigurationSchema = z.object({ name, defaultMaxOccupancy })

export type CreateRoomConfigurationInput = z.infer<typeof createRoomConfigurationSchema>
export type UpdateRoomConfigurationInput = z.infer<typeof updateRoomConfigurationSchema>
