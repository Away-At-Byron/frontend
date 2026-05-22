import "server-only"

import { eq, asc } from "drizzle-orm"
import { contacts, contactTypes, groups } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, type ActionResult } from "@/lib/result"
import { CONTACT_PERMISSIONS } from "./permissions"
import type { ContactRow, ContactTypeOption } from "./types"

export type { ContactRow, ContactTypeOption } from "./types"

/** Columns shared by listContacts and the single-row fetch in actions.ts. */
export const contactSelection = {
  id: contacts.id,
  contactTypeId: contacts.contactTypeId,
  contactTypeName: contactTypes.name,
  firstName: contacts.firstName,
  lastName: contacts.lastName,
  email: contacts.email,
  phone: contacts.phone,
  birthday: contacts.birthday,
  communicationPreference: contacts.communicationPreference,
  marketingOptIn: contacts.marketingOptIn,
  returningGuest: contacts.returningGuest,
  portalEnabled: contacts.portalEnabled,
  notes: contacts.notes,
  addressStreet: contacts.addressStreet,
  addressSuburb: contacts.addressSuburb,
  addressCity: contacts.addressCity,
  addressState: contacts.addressState,
  addressPostcode: contacts.addressPostcode,
  addressCountry: contacts.addressCountry,
  relatedClientId: contacts.relatedClientId,
  groupId: contacts.groupId,
  groupName: groups.groupName,
  idType: contacts.idType,
  idNumber: contacts.idNumber,
  idCountry: contacts.idCountry,
  idVerified: contacts.idVerified,
  idVerificationDate: contacts.idVerificationDate,
  firstBookingDate: contacts.firstBookingDate,
  preferredBookingChannel: contacts.preferredBookingChannel,
  otaUser: contacts.otaUser,
  directBookingGuest: contacts.directBookingGuest,
  corporateGuest: contacts.corporateGuest,
  specialRequests: contacts.specialRequests,
  accessibilityRequirements: contacts.accessibilityRequirements,
  lastContactDate: contacts.lastContactDate,
  doNotRebook: contacts.doNotRebook,
  tier: contacts.tier,
  source: contacts.source,
  guestType: contacts.guestType,
} as const

export function mapContactRow(
  r: Omit<ContactRow, "stayCount" | "lastStayLabel">,
): ContactRow {
  return {
    ...r,
    // stayCount / lastStayLabel are derived from bookings (Booking module).
    stayCount: 0,
    lastStayLabel: null,
  }
}

export async function listContacts(): Promise<ActionResult<ContactRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select(contactSelection)
        .from(contacts)
        .leftJoin(contactTypes, eq(contacts.contactTypeId, contactTypes.id))
        .leftJoin(groups, eq(contacts.groupId, groups.id))
        .orderBy(contacts.lastName, contacts.firstName)

      return ok(rows.map(mapContactRow))
    }),
  )
}

/** Active (non-deleted) contact types for the contact form select. */
export async function listContactTypes(): Promise<ActionResult<ContactTypeOption[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({ id: contactTypes.id, name: contactTypes.name })
        .from(contactTypes)
        .where(eq(contactTypes.isDeleted, false))
        .orderBy(asc(contactTypes.name))
      return ok(rows)
    }),
  )
}
