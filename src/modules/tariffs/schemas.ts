import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

export const tariffTrafficValues = ["ota", "direct", "other"] as const
export const tariffTrafficSchema = z.enum(tariffTrafficValues)
export type TariffTraffic = z.infer<typeof tariffTrafficSchema>

export const TARIFF_TRAFFIC_LABEL: Record<TariffTraffic, string> = {
  ota: "OTA",
  direct: "Direct",
  other: "Other",
}

export const createTariffSchema = z.object({
  name,
  traffic: tariffTrafficSchema,
})
export const updateTariffSchema = z.object({
  name,
  traffic: tariffTrafficSchema,
})

export type CreateTariffInput = z.infer<typeof createTariffSchema>
export type UpdateTariffInput = z.infer<typeof updateTariffSchema>
