import "server-only"

import { eq, type SQL } from "drizzle-orm"
import { contacts, properties } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, type ActionResult } from "@/lib/result"
import { CONTACT_PERMISSIONS } from "./permissions"
import type { ContactRow, PropertyOption } from "./types"
import { formatBirthday, tierFor } from "./utils"

export type { ContactRow, PropertyOption, ContactTier } from "./types"

function propertyScope(ctx: { propertyId: string | null }): SQL | undefined {
  return ctx.propertyId ? eq(contacts.propertyId, ctx.propertyId) : undefined
}

function mapRow(
  r: {
    id: string
    propertyId: string
    propertyName: string
    clientNumber: string
    contactType: "guest" | "housekeeper" | "contractor"
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    birthday: Date | null
    communicationPreference: "email" | "sms"
    marketingOptIn: boolean
    returningGuest: boolean
    isVip: boolean
    portalEnabled: boolean
    groupName: string | null
    notes: string | null
    addressStreet: string | null
    addressSuburb: string | null
    addressCity: string | null
    addressPostcode: string | null
    addressCountry: string | null
    relatedClientId: string | null
    groupId: string | null
  },
): ContactRow {
  return {
    ...r,
    birthday: formatBirthday(r.birthday),
    tier: tierFor(r),
    stayCount: 0,
    lastStayLabel: null,
  }
}

export async function listContacts(): Promise<ActionResult<ContactRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const scope = propertyScope(ctx)
      const rows = await tx
        .select({
          id: contacts.id,
          propertyId: contacts.propertyId,
          propertyName: properties.name,
          clientNumber: contacts.clientNumber,
          contactType: contacts.contactType,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          phone: contacts.phone,
          birthday: contacts.birthday,
          communicationPreference: contacts.communicationPreference,
          marketingOptIn: contacts.marketingOptIn,
          returningGuest: contacts.returningGuest,
          isVip: contacts.isVip,
          portalEnabled: contacts.portalEnabled,
          groupName: contacts.groupName,
          notes: contacts.notes,
          addressStreet: contacts.addressStreet,
          addressSuburb: contacts.addressSuburb,
          addressCity: contacts.addressCity,
          addressPostcode: contacts.addressPostcode,
          addressCountry: contacts.addressCountry,
          relatedClientId: contacts.relatedClientId,
          groupId: contacts.groupId,
        })
        .from(contacts)
        .innerJoin(properties, eq(contacts.propertyId, properties.id))
        .where(scope)
        .orderBy(contacts.lastName, contacts.firstName)

      return ok(rows.map(mapRow))
    }),
  )
}

export async function listPropertiesForContacts(): Promise<
  ActionResult<PropertyOption[]>
> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      if (ctx.propertyId) {
        const row = await tx
          .select({ id: properties.id, name: properties.name })
          .from(properties)
          .where(eq(properties.id, ctx.propertyId))
          .limit(1)
        return ok(row)
      }
      const rows = await tx
        .select({ id: properties.id, name: properties.name })
        .from(properties)
        .orderBy(properties.name)
      return ok(rows)
    }),
  )
}
