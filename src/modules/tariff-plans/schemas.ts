import { z } from "zod"

/** Strip non-alphanumeric and uppercase. Mirrors discount_types.deriveCode. */
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

const uuid = z.string().uuid("Pick a value")

const status = z.enum(["active", "inactive"])

const shape = {
  name,
  code,
  tariffBeginningPriceId: uuid,
  propertyId: uuid,
  roomTypeId: uuid,
  status,
}

export const createTariffPlanSchema = z.object(shape)
export const updateTariffPlanSchema = z.object(shape)

export type CreateTariffPlanInput = z.infer<typeof createTariffPlanSchema>
export type UpdateTariffPlanInput = z.infer<typeof updateTariffPlanSchema>
