export type PropertyStatus = "active" | "inactive"

export type PropertyRow = {
  id: string
  name: string
  addressStreet: string | null
  addressSuburb: string | null
  addressCity: string | null
  addressPostcode: string | null
  numberOfRooms: number
  propertyColour: string | null
  status: PropertyStatus
}

/**
 * Full Edit Property payload. Owner email/phone come from the linked
 * contacts row, joined at read time; if a contact has no value or no
 * link exists the field is null.
 */
export type PropertyDetail = {
  id: string
  name: string
  addressStreet: string | null
  addressSuburb: string | null
  addressCity: string | null
  addressState: string | null
  addressPostcode: string | null
  addressCountry: string | null
  numberOfRooms: number
  propertyColour: string | null
  status: PropertyStatus
  taxNumber: string | null
  website: string | null

  propertyManagerUserId: string | null
  propertyManagerName: string | null
  onCallNumber: string | null
  propertyEmail: string | null
  lockboxAccess: string | null
  wifiNetwork: string | null

  owner1ContactId: string | null
  owner1Name: string | null
  owner1Email: string | null
  owner1Phone: string | null
  owner2ContactId: string | null
  owner2Name: string | null
  owner2Email: string | null
  owner2Phone: string | null
}

export type ManagerOption = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export type OwnerOption = {
  id: string
  name: string
  email: string | null
  phone: string | null
}
