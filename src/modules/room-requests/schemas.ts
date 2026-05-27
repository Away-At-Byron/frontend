import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

/**
 * Optional uppercase-alphanumeric code. Empty string is normalised to null
 * so an admin who clears the field gets the same effect as leaving it
 * blank. The DB partial unique index enforces uniqueness when set.
 */
const code = z
  .union([
    z.literal("").transform(() => null),
    z
      .string()
      .trim()
      .min(1)
      .max(40, "Keep it under 40 characters")
      .regex(/^[A-Z0-9]+$/, "Uppercase letters and digits only, no spaces"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined ? null : v))

export const createRoomRequestSchema = z.object({ name, code })
export const updateRoomRequestSchema = z.object({ name, code })

export type CreateRoomRequestInput = z.infer<typeof createRoomRequestSchema>
export type UpdateRoomRequestInput = z.infer<typeof updateRoomRequestSchema>
