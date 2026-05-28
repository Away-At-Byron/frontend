import { z } from "zod"

/** The only editable field on the cost-category catalogue. */
const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const createCostCategorySchema = z.object({ name })
export const updateCostCategorySchema = z.object({ name })

export type CreateCostCategoryInput = z.infer<typeof createCostCategorySchema>
export type UpdateCostCategoryInput = z.infer<typeof updateCostCategorySchema>
