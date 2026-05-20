/** Shared contact DTO types — safe to import from client components. */

export type ContactTier = "new" | "returning" | "vip"

export type ContactRow = {
  id: string
  propertyId: string
  propertyName: string
  clientNumber: string
  contactType: "guest" | "housekeeper" | "contractor"
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  birthday: string | null
  communicationPreference: "email" | "sms"
  marketingOptIn: boolean
  returningGuest: boolean
  isVip: boolean
  groupName: string | null
  notes: string | null
  addressStreet: string | null
  addressSuburb: string | null
  addressCity: string | null
  addressPostcode: string | null
  addressCountry: string | null
  relatedClientId: string | null
  groupId: string | null
  tier: ContactTier
  stayCount: number
  lastStayLabel: string | null
}

export type PropertyOption = { id: string; name: string }
