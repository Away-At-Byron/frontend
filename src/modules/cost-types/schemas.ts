import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

const costCategoryId = z.string().uuid("Pick a cost category")

const basis = z.enum([
  "flat",
  "per_night",
  "per_person",
  "per_room",
  "percentage",
])

/**
 * Decimal user input. For `percentage` 0..100; otherwise dollars 0+. The
 * action layer multiplies by 100 and stores as int. Empty string -> 0.
 */
const defaultValue = z
  .union([
    z.literal("").transform(() => 0),
    z.coerce.number().min(0, "0 or higher"),
  ])
  .optional()
  .transform((v) => (v === undefined ? 0 : v))

/** Accepts either a real boolean (legacy callers) or the "active"/"inactive"
 * status string the modal uses. Stored as boolean. */
const isActive = z.union([
  z.boolean(),
  z.enum(["active", "inactive"]).transform((v) => v === "active"),
])

const shape = {
  name,
  costCategoryId,
  basis,
  defaultValue,
  canBeOverridden: z.coerce.boolean(),
  isActive,
}

function refine(s: z.ZodObject<typeof shape>) {
  return s.superRefine((data, ctx) => {
    if (data.basis === "percentage" && data.defaultValue > 100) {
      ctx.addIssue({
        path: ["defaultValue"],
        code: z.ZodIssueCode.custom,
        message: "Percentage must be 0-100",
      })
    }
  })
}

export const createCostTypeSchema = refine(z.object(shape))
export const updateCostTypeSchema = refine(z.object(shape))

export type CreateCostTypeInput = z.infer<typeof createCostTypeSchema>
export type UpdateCostTypeInput = z.infer<typeof updateCostTypeSchema>

/** Human label for the basis enum. */
export const BASIS_LABEL: Record<z.infer<typeof basis>, string> = {
  flat: "Flat (per stay)",
  per_night: "Per night",
  per_person: "Per person",
  per_room: "Per room",
  percentage: "Percentage",
}
