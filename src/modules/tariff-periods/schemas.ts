import { z } from "zod"

const code = z
  .string()
  .trim()
  .min(1, "Required")
  .max(40, "Keep it under 40 characters")

const description = z
  .string()
  .trim()
  .max(200, "Keep it under 200 characters")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

/** ISO date string yyyy-mm-dd (native HTML date input format). */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")

const shape = {
  code,
  description,
  fromDate: isoDate,
  toDate: isoDate,
}

function refine<T extends z.ZodObject<typeof shape>>(s: T) {
  return s.superRefine((data, ctx) => {
    if (data.toDate < data.fromDate) {
      ctx.addIssue({
        path: ["toDate"],
        code: z.ZodIssueCode.custom,
        message: "To must be on or after From",
      })
    }
  })
}

export const createTariffPeriodSchema = refine(z.object(shape))
export const updateTariffPeriodSchema = refine(z.object(shape))

export type CreateTariffPeriodInput = z.infer<typeof createTariffPeriodSchema>
export type UpdateTariffPeriodInput = z.infer<typeof updateTariffPeriodSchema>
