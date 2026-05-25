import "server-only"

import { eq, asc, desc, sql } from "drizzle-orm"
import { contacts, contactTypes, contactSources, groups } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, type ActionResult } from "@/lib/result"
import { CONTACT_PERMISSIONS } from "./permissions"
import type {
  ContactRow,
  ContactSourceOption,
  ContactTypeOption,
  GroupOption,
  GroupRow,
} from "./types"

export type {
  ContactRow,
  ContactSourceOption,
  ContactTypeOption,
  GroupOption,
  GroupRow,
} from "./types"

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
  contactSourceId: contacts.contactSourceId,
  contactSourceName: contactSources.name,
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

export type ContactOption = {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

/** Lightweight list of contacts for the "Related client" search picker. */
export async function listContactOptions(): Promise<ActionResult<ContactOption[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
        })
        .from(contacts)
        .where(eq(contacts.isDeleted, false))
        .orderBy(asc(contacts.firstName), asc(contacts.lastName))
      return ok(rows)
    }),
  )
}

export type GroupMember = {
  id: string
  firstName: string
  lastName: string
  contactTypeName: string | null
  createdAt: string
}

/** Members of a group, in creation order. */
export async function listGroupMembers(
  groupId: string,
): Promise<ActionResult<GroupMember[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          contactTypeName: contactTypes.name,
          createdAt: contacts.createdAt,
        })
        .from(contacts)
        .leftJoin(contactTypes, eq(contacts.contactTypeId, contactTypes.id))
        .where(
          sql`${contacts.groupId} = ${groupId} AND ${contacts.isDeleted} = false`,
        )
        .orderBy(asc(contacts.createdAt))
      return ok(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      )
    }),
  )
}

export async function getContact(
  id: string,
): Promise<ActionResult<ContactRow | null>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select(contactSelection)
        .from(contacts)
        .leftJoin(contactTypes, eq(contacts.contactTypeId, contactTypes.id))
        .leftJoin(contactSources, eq(contacts.contactSourceId, contactSources.id))
        .leftJoin(groups, eq(contacts.groupId, groups.id))
        .where(eq(contacts.id, id))
        .limit(1)
      const r = rows[0]
      return ok(r ? mapContactRow(r) : null)
    }),
  )
}

export async function listContacts(): Promise<ActionResult<ContactRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select(contactSelection)
        .from(contacts)
        .leftJoin(contactTypes, eq(contacts.contactTypeId, contactTypes.id))
        .leftJoin(contactSources, eq(contacts.contactSourceId, contactSources.id))
        .leftJoin(groups, eq(contacts.groupId, groups.id))
        .where(eq(contacts.isDeleted, false))
        // Newest contacts first.
        .orderBy(desc(contacts.createdAt))

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

/** Active (non-deleted) groups for the contact form select. */
export async function listGroupOptions(): Promise<ActionResult<GroupOption[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({ id: groups.id, groupName: groups.groupName })
        .from(groups)
        .where(eq(groups.isDeleted, false))
        .orderBy(asc(groups.groupName))
      return ok(rows)
    }),
  )
}

/** Group bookings with a live member count (FRS §6.4). */
export async function listGroups(): Promise<ActionResult<GroupRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({
          id: groups.id,
          groupName: groups.groupName,
          relationships: groups.relationships,
          companyName: groups.companyName,
          corporateAccountId: groups.corporateAccountId,
          travelAgentId: groups.travelAgentId,
          groupBookerFlag: groups.groupBookerFlag,
          billingPreference: groups.billingPreference,
          taxAbn: groups.taxAbn,
          memberCount: sql<number>`count(${contacts.id})::int`,
          createdAt: groups.createdAt,
        })
        .from(groups)
        .leftJoin(
          contacts,
          sql`${contacts.groupId} = ${groups.id} AND ${contacts.isDeleted} = false`,
        )
        .where(eq(groups.isDeleted, false))
        .groupBy(groups.id)
        .orderBy(desc(groups.createdAt))

      return ok(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      )
    }),
  )
}

/** Active (non-deleted) contact sources for the contact form select. */
export async function listContactSources(): Promise<
  ActionResult<ContactSourceOption[]>
> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({ id: contactSources.id, name: contactSources.name })
        .from(contactSources)
        .where(eq(contactSources.isDeleted, false))
        .orderBy(asc(contactSources.name))
      return ok(rows)
    }),
  )
}
