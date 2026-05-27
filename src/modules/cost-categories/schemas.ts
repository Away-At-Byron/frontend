import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

const costTypeId = z.string().uuid("Pick a cost type")

const basis = z.enum([
  "flat",
  "per_night",
  "per_person",
  "per_room",
  "percentage",
])

/**
 * Decimal user input. For percentage 0-100; otherwise dollars 0+. The
 * action layer multiplies by 100 and stores as int. Empty string → 0.
 */
const amount = z
  .union([
    z.literal("").transform(() => 0),
    z.coerce.number().min(0, "0 or higher"),
  ])
  .optional()
  .transform((v) => (v === undefined ? 0 : v))

const shape = {
  name,
  costTypeId,
  basis,
  amount,
  isOverridden: z.coerce.boolean(),
  isActive: z.coerce.boolean(),
}

function refine(s: z.ZodObject<typeof shape>) {
  return s.superRefine((data, ctx) => {
    if (data.basis === "percentage" && data.amount > 100) {
      ctx.addIssue({
        path: ["amount"],
        code: z.ZodIssueCode.custom,
        message: "Percentage must be 0-100",
      })
    }
  })
}

export const createCostCategorySchema = refine(z.object(shape))
export const updateCostCategorySchema = refine(z.object(shape))

export type CreateCostCategoryInput = z.infer<typeof createCostCategorySchema>
export type UpdateCostCategoryInput = z.infer<typeof updateCostCategorySchema>

/** Human label for the basis enum. */
export const BASIS_LABEL: Record<
  z.infer<typeof basis>,
  string
> = {
  flat: "Flat (per stay)",
  per_night: "Per night",
  per_person: "Per person",
  per_room: "Per room",
  percentage: "Percentage",
}
