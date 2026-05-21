import { z } from "zod"

const name = z.string().trim().min(1, "Required").max(120)
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))

export const contactTypeSchema = z.enum(["guest", "housekeeper", "contractor"])
export const communicationPreferenceSchema = z.enum(["email", "sms", "both", "none"])

const contactFields = {
  contactType: contactTypeSchema.default("guest"),
  firstName: name,
  lastName: name,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: optionalText,
  addressStreet: optionalText,
  addressSuburb: optionalText,
  addressCity: optionalText,
  addressPostcode: z.string().trim().max(20).optional().transform((v) => (v ? v : undefined)),
  addressCountry: z.string().trim().length(2, "Use a 2-letter country code").optional().transform((v) => (v ? v.toUpperCase() : undefined)),
  birthday: z
    .string()
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
  communicationPreference: communicationPreferenceSchema.default("email"),
  marketingOptIn: z.boolean().default(false),
  relatedClientId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  groupId: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  groupName: optionalText,
  notes: z.string().trim().max(4000).optional().transform((v) => (v ? v : undefined)),
  returningGuest: z.boolean().default(false),
  isVip: z.boolean().default(false),
  portalEnabled: z.boolean().default(false),
  propertyId: z.string().uuid().optional(),
}

export const createContactSchema = z.object(contactFields)

export const updateContactSchema = z.object(contactFields)

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
