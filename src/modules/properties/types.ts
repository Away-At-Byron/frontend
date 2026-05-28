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
