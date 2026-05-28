import type { PropertyDetail } from "../types"
import type { UpdatePropertyInput } from "../schemas"

export type FormState = {
  name: string
  addressStreet: string
  addressSuburb: string
  addressCity: string
  addressState: string
  addressPostcode: string
  addressCountry: string
  status: "active" | "inactive"
  propertyColour: string
  taxNumber: string
  website: string

  propertyManagerUserId: string
  onCallNumber: string
  propertyEmail: string
  lockboxAccess: string
  wifiNetwork: string

  owner1ContactId: string
  owner2ContactId: string
}

export function initialForm(p: PropertyDetail): FormState {
  return {
    name: p.name ?? "",
    addressStreet: p.addressStreet ?? "",
    addressSuburb: p.addressSuburb ?? "",
    addressCity: p.addressCity ?? "",
    addressState: p.addressState ?? "",
    addressPostcode: p.addressPostcode ?? "",
    addressCountry: p.addressCountry ?? "AU",
    status: p.status,
    propertyColour: p.propertyColour ?? "",
    taxNumber: p.taxNumber ?? "",
    website: p.website ?? "",
    propertyManagerUserId: p.propertyManagerUserId ?? "",
    onCallNumber: p.onCallNumber ?? "",
    propertyEmail: p.propertyEmail ?? "",
    lockboxAccess: p.lockboxAccess ?? "",
    wifiNetwork: p.wifiNetwork ?? "",
    owner1ContactId: p.owner1ContactId ?? "",
    owner2ContactId: p.owner2ContactId ?? "",
  }
}

const nullIfBlank = (s: string): string | null =>
  s.trim() === "" ? null : s.trim()

export function toPayload(form: FormState): UpdatePropertyInput {
  return {
    name: form.name.trim(),
    addressStreet: nullIfBlank(form.addressStreet),
    addressSuburb: nullIfBlank(form.addressSuburb),
    addressCity: nullIfBlank(form.addressCity),
    addressState: nullIfBlank(form.addressState),
    addressPostcode: nullIfBlank(form.addressPostcode),
    addressCountry: form.addressCountry.trim() || "AU",
    status: form.status,
    propertyColour: nullIfBlank(form.propertyColour),
    taxNumber: nullIfBlank(form.taxNumber),
    website: nullIfBlank(form.website),
    propertyManagerUserId: nullIfBlank(form.propertyManagerUserId),
    onCallNumber: nullIfBlank(form.onCallNumber),
    propertyEmail: nullIfBlank(form.propertyEmail),
    lockboxAccess: nullIfBlank(form.lockboxAccess),
    wifiNetwork: nullIfBlank(form.wifiNetwork),
    owner1ContactId: nullIfBlank(form.owner1ContactId),
    owner2ContactId: nullIfBlank(form.owner2ContactId),
  }
}
