import { z } from "zod"
import {
  COMMUNICATION_PREFERENCES,
  CONTACT_ID_TYPES,
  CONTACT_TIERS,
  CONTACT_SOURCES,
  GUEST_TYPES,
} from "./types"

const name = z.string().trim().min(1, "Required").max(120)
const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
const longText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v ? v : undefined))
const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined))
/** A yyyy-mm-dd value from a date input, or nothing. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? v : undefined))

export const communicationPreferenceSchema = z.enum(COMMUNICATION_PREFERENCES)
export const contactIdTypeSchema = z.enum(CONTACT_ID_TYPES)
export const contactTierSchema = z.enum(CONTACT_TIERS)
export const contactSourceSchema = z.enum(CONTACT_SOURCES)
export const guestTypeSchema = z.enum(GUEST_TYPES)

const contactFields = {
  contactTypeId: optionalUuid,
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
  addressState: optionalText,
  addressPostcode: z.string().trim().max(20).optional().transform((v) => (v ? v : undefined)),
  addressCountry: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  // Day + month only, no year.
  birthday: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Use MM-DD")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  communicationPreference: communicationPreferenceSchema.default("email"),
  marketingOptIn: z.boolean().default(false),
  relatedClientId: optionalUuid,
  groupId: optionalUuid,
  notes: longText,
  returningGuest: z.boolean().default(false),

  // Government ID (guests only — enforced in the server action).
  idType: contactIdTypeSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  idNumber: optionalText,
  idCountry: optionalText,
  idVerified: z.boolean().default(false),
  idVerificationDate: optionalDate,

  // Booking profile.
  firstBookingDate: optionalDate,
  preferredBookingChannel: optionalText,
  otaUser: z.boolean().default(false),
  directBookingGuest: z.boolean().default(false),
  corporateGuest: z.boolean().default(false),
  specialRequests: longText,
  accessibilityRequirements: longText,
  lastContactDate: optionalDate,
  doNotRebook: z.boolean().default(false),
  tier: contactTierSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  source: contactSourceSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  guestType: guestTypeSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),

  portalEnabled: z.boolean().default(false),
}

export const createContactSchema = z.object(contactFields)
export const updateContactSchema = z.object(contactFields)

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
