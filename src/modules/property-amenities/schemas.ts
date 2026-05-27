import { z } from "zod"

const category = z
  .string()
  .trim()
  .min(1, "Required")
  .max(50, "Keep it under 50 characters")

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

/**
 * `sort_order` is derived on the server (new rows go to end of category;
 * reorder is a separate Up/Down action). The modal does not expose it.
 */
export const createPropertyAmenitySchema = z.object({ category, name })
export const updatePropertyAmenitySchema = z.object({ category, name })

export type CreatePropertyAmenityInput = z.infer<typeof createPropertyAmenitySchema>
export type UpdatePropertyAmenityInput = z.infer<typeof updatePropertyAmenitySchema>
