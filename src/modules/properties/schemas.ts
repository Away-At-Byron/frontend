import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(120, "Keep it under 120 characters")

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : v.trim()))
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .string()
        .max(max, `Keep it under ${max} characters`)
        .nullable(),
    )

const optionalUuid = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null || v === "" ? null : v))
  .pipe(z.string().uuid("Pick a valid record").nullable())

const country = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null || v === "" ? "AU" : v.trim().toUpperCase()))
  .pipe(z.string().length(2, "Use a 2-letter ISO country code"))

const status = z.enum(["active", "inactive"])

/**
 * Address-only payload — the Add Property form (simple) submits this shape.
 * Everything else falls back to defaults until the user opens Edit.
 */
export const createPropertySchema = z.object({
  name,
  addressStreet: optionalText(200),
  addressSuburb: optionalText(120),
  addressCity: optionalText(120),
  addressState: optionalText(60),
  addressPostcode: optionalText(20),
  addressCountry: country,
  status: status.optional().default("active"),
  propertyColour: optionalText(40),
})

/**
 * Edit Property form payload — Details tab. Amenities are saved by a
 * separate action so the two areas can persist independently.
 */
export const updatePropertySchema = z.object({
  name,
  addressStreet: optionalText(200),
  addressSuburb: optionalText(120),
  addressCity: optionalText(120),
  addressState: optionalText(60),
  addressPostcode: optionalText(20),
  addressCountry: country,
  status,
  propertyColour: optionalText(40),
  taxNumber: optionalText(40),
  website: optionalText(200),

  propertyManagerUserId: optionalUuid,
  onCallNumber: optionalText(60),
  propertyEmail: optionalText(120),
  lockboxAccess: optionalText(200),
  wifiNetwork: optionalText(200),

  owner1ContactId: optionalUuid,
  owner2ContactId: optionalUuid,
})

export const setPropertyAmenitiesSchema = z.object({
  amenityIds: z.array(z.string().uuid()).default([]),
})

export type CreatePropertyInput = z.infer<typeof createPropertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
export type SetPropertyAmenitiesInput = z.infer<typeof setPropertyAmenitiesSchema>
