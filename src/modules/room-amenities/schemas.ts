import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createRoomAmenitySchema = z.object({ name })
export const updateRoomAmenitySchema = z.object({ name })

export type CreateRoomAmenityInput = z.infer<typeof createRoomAmenitySchema>
export type UpdateRoomAmenityInput = z.infer<typeof updateRoomAmenitySchema>
