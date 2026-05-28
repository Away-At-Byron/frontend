import { z } from "zod"

/** Strip non-alphanumeric and uppercase. Mirrors discount_types.deriveCode. */
export function deriveCode(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
}

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

const code = z
  .string()
  .trim()
  .min(1, "Required")
  .max(40, "Keep it under 40 characters")
  .regex(/^[A-Z0-9]+$/, "Uppercase letters and digits only, no spaces")

export const tariffTrafficValues = ["ota", "direct", "other"] as const
export const tariffTrafficSchema = z.enum(tariffTrafficValues)
export type TariffTraffic = z.infer<typeof tariffTrafficSchema>

export const TARIFF_TRAFFIC_LABEL: Record<TariffTraffic, string> = {
  ota: "OTA",
  direct: "Direct",
  other: "Other",
}

export const tariffBasisValues = ["per_night", "per_week", "long_stay"] as const
export const tariffBasisSchema = z.enum(tariffBasisValues)
export type TariffBasis = z.infer<typeof tariffBasisSchema>

export const TARIFF_BASIS_LABEL: Record<TariffBasis, string> = {
  per_night: "Per Night",
  per_week: "Per Week",
  long_stay: "Long Stay",
}

export const tariffStatusValues = ["active", "inactive"] as const
export const tariffStatusSchema = z.enum(tariffStatusValues)
export type TariffStatus = z.infer<typeof tariffStatusSchema>

export const TARIFF_STATUS_LABEL: Record<TariffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

/**
 * `propertyId` null → applies to every property.
 * `roomId` null → applies to every room in scope. The rooms table has
 * not landed yet, so the value passes through as a plain uuid.
 */
const propertyId = z
  .string()
  .uuid("Pick a property")
  .nullable()
  .or(z.literal("").transform(() => null))

const roomId = z
  .string()
  .uuid("That doesn't look like a room id")
  .nullable()
  .or(z.literal("").transform(() => null))

const tariffPeriodId = z
  .string()
  .uuid("Pick a tariff period")
  .nullable()
  .or(z.literal("").transform(() => null))

const shape = {
  name,
  code,
  tariffBasis: tariffBasisSchema,
  refundable: z.boolean(),
  breakfastIncluded: z.boolean(),
  traffic: tariffTrafficSchema,
  status: tariffStatusSchema,
  propertyId,
  roomId,
  tariffPeriodId,
}

export const createTariffSchema = z.object(shape)
export const updateTariffSchema = z.object(shape)

export type CreateTariffInput = z.infer<typeof createTariffSchema>
export type UpdateTariffInput = z.infer<typeof updateTariffSchema>
