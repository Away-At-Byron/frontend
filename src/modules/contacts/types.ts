/** Shared contact DTO types + enum value/label maps — client-safe. */

export const COMMUNICATION_PREFERENCES = [
  "email",
  "sms",
  "both",
  "none",
  "unsubscribed",
] as const
export type CommunicationPreference = (typeof COMMUNICATION_PREFERENCES)[number]
export const COMMUNICATION_PREFERENCE_LABELS: Record<CommunicationPreference, string> = {
  email: "Email",
  sms: "SMS",
  both: "Both",
  none: "None",
  unsubscribed: "Unsubscribed",
}

export const CONTACT_ID_TYPES = ["passport", "drivers_license", "national_id", "other"] as const
export type ContactIdType = (typeof CONTACT_ID_TYPES)[number]
export const CONTACT_ID_TYPE_LABELS: Record<ContactIdType, string> = {
  passport: "Passport",
  drivers_license: "Driver's licence",
  national_id: "National ID",
  other: "Other",
}

export const CONTACT_TIERS = ["bronze", "silver", "gold", "vip"] as const
export type ContactTier = (typeof CONTACT_TIERS)[number]
export const CONTACT_TIER_LABELS: Record<ContactTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  vip: "VIP",
}

export type ContactTypeOption = { id: string; name: string }
export type ContactSourceOption = { id: string; name: string }
export type GuestTypeOption = { id: string; name: string }

export type ContactRow = {
  id: string
  contactTypeId: string | null
  contactTypeName: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  /** Stored "MM-DD"; format for display with formatBirthday. */
  birthday: string | null
  communicationPreference: CommunicationPreference
  marketingOptIn: boolean
  returningGuest: boolean
  portalEnabled: boolean
  notes: string | null
  addressStreet: string | null
  addressSuburb: string | null
  addressCity: string | null
  addressState: string | null
  addressPostcode: string | null
  addressCountry: string | null
  groupId: string | null
  groupName: string | null
  idType: ContactIdType | null
  idNumber: string | null
  idCountry: string | null
  idVerified: boolean
  idVerificationDate: string | null
  firstBookingDate: string | null
  preferredBookingChannel: string | null
  specialRequests: string | null
  accessibilityRequirements: string | null
  lastContactDate: string | null
  doNotRebook: boolean
  tier: ContactTier | null
  contactSourceId: string | null
  contactSourceName: string | null
  guestTypeId: string | null
  guestTypeName: string | null
  /** Derived from bookings (Booking module); 0 until that module lands. */
  stayCount: number
  lastStayLabel: string | null
}

/** Lightweight option used by the contact form's Group select. */
export type GroupOption = {
  id: string
  groupName: string
}

/** Read-only row for the Group Management list (FRS §6.4 group bookings). */
export type GroupRow = {
  id: string
  groupName: string
  relationships: string | null
  reason: string | null
  groupAge: string | null
  companyName: string | null
  corporateAccountId: string | null
  travelAgentId: string | null
  groupBookerFlag: boolean
  billingPreference: string | null
  taxAbn: string | null
  memberCount: number
  createdAt: string
}
