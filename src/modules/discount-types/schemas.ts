import { z } from "zod"

/**
 * Form-shape schema: dollar/percent values arrive as decimal numbers from
 * the modal and get converted to integer cents / basis points in the
 * server action (see actions.ts). `value` carries the user's typed number;
 * the action multiplies by 100 and rounds based on `type`.
 */

/** Strip everything that is not [A-Za-z0-9] then upper-case. */
export function deriveCode(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
}

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

const code = z
  .string()
  .trim()
  .min(1, "Required")
  .max(40, "Keep it under 40 characters")
  .regex(/^[A-Z0-9]+$/, "Uppercase letters and digits only, no spaces")

const description = z
  .union([
    z.literal("").transform(() => null),
    z.string().trim().max(500, "Keep it under 500 characters"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v))

const type = z.enum(["percentage", "flat", "cashback"])
const activationMode = z.enum(["duration", "manual"])

/** A decimal number (e.g. 25 for 25%, 50.5 for $50.50). Empty string disallowed. */
const decimalRequired = z.coerce
  .number({ invalid_type_error: "Enter a number" })
  .min(0, "0 or higher")

/** Optional decimal field - empty string becomes null. */
const decimalOptional = z
  .union([
    z.literal("").transform(() => null),
    z.coerce.number().min(0, "0 or higher"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined ? null : v))

/**
 * Optional integer field - empty string OR zero becomes null. 0 is treated
 * as "no minimum" so an admin who types 0 in the min-nights box gets the
 * same effect as leaving it blank.
 */
const intOptional = z
  .union([
    z.literal("").transform(() => null),
    z.coerce.number().int("Whole number only").min(0, "0 or higher"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined || v === 0 ? null : v))

/** Optional date field - empty string becomes null. */
const dateOptional = z
  .union([
    z.literal("").transform(() => null),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v))

const baseShape = {
  name,
  code,
  description,
  type,
  value: decimalRequired,
  maxDiscount: decimalOptional,
  durationStart: dateOptional,
  durationEnd: dateOptional,
  activationMode,
  minAmount: decimalOptional,
  minNights: intOptional,
  stackable: z.coerce.boolean(),
}

function refine(schema: z.ZodObject<typeof baseShape>) {
  return schema.superRefine((data, ctx) => {
    if (data.type === "percentage" && data.value > 100) {
      ctx.addIssue({
        path: ["value"],
        code: z.ZodIssueCode.custom,
        message: "Percentage must be 0-100",
      })
    }
    if (
      data.durationStart &&
      data.durationEnd &&
      data.durationEnd < data.durationStart
    ) {
      ctx.addIssue({
        path: ["durationEnd"],
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
      })
    }
    // minNights: 0/empty is normalised to null by the schema, so anything
    // reaching here is already >= 1 - no further check needed.
  })
}

export const createDiscountTypeSchema = refine(z.object(baseShape))
export const updateDiscountTypeSchema = refine(z.object(baseShape))

export type CreateDiscountTypeInput = z.infer<typeof createDiscountTypeSchema>
export type UpdateDiscountTypeInput = z.infer<typeof updateDiscountTypeSchema>
