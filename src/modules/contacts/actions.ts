"use server"

import { eq, and, max } from "drizzle-orm"
import { contacts, properties } from "@/db/schema"
import { withTenant, withPermission, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult } from "@/lib/result"
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "./schemas"
import { CONTACT_PERMISSIONS } from "./permissions"
import type { ContactRow } from "./types"
import { formatBirthday, tierFor } from "./utils"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function parseBirthday(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function resolvePropertyId(
  ctx: TenantContext,
  inputPropertyId: string | undefined,
): ActionResult<{ propertyId: string }> {
  if (ctx.propertyId) return ok({ propertyId: ctx.propertyId })
  if (!inputPropertyId) {
    return err("VALIDATION", "Select a property for this contact.", {
      propertyId: ["Required"],
    })
  }
  return ok({ propertyId: inputPropertyId })
}

async function nextClientNumber(
  tx: Tx,
  propertyId: string,
): Promise<{ clientNumber: string; clientSeq: number }> {
  const row = await tx
    .select({ seq: max(contacts.clientSeq) })
    .from(contacts)
    .where(eq(contacts.propertyId, propertyId))
  const clientSeq = Number(row[0]?.seq ?? 0) + 1
  return { clientSeq, clientNumber: `G-${1000 + clientSeq}` }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "23505"
  )
}

async function fetchContactRow(
  tx: Tx,
  id: string,
): Promise<ContactRow | null> {
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
    .where(eq(contacts.id, id))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  return {
    ...r,
    birthday: formatBirthday(r.birthday),
    tier: tierFor(r),
    stayCount: 0,
    lastStayLabel: null,
  }
}

export async function createContact(
  input: CreateContactInput,
): Promise<ActionResult<ContactRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.create, ctx, async () => {
      const parsed = createContactSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      const prop = resolvePropertyId(ctx, data.propertyId)
      if (!prop.ok) return prop
      const propertyId = prop.data.propertyId

      const { clientNumber, clientSeq } = await nextClientNumber(tx, propertyId)

      try {
        const inserted = await tx
          .insert(contacts)
          .values({
            propertyId,
            createdBy: ctx.userId,
            clientNumber,
            clientSeq,
            contactType: data.contactType,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email ?? null,
            phone: data.phone ?? null,
            addressStreet: data.addressStreet ?? null,
            addressSuburb: data.addressSuburb ?? null,
            addressCity: data.addressCity ?? null,
            addressPostcode: data.addressPostcode ?? null,
            addressCountry: data.addressCountry ?? "AU",
            birthday: parseBirthday(data.birthday),
            communicationPreference: data.communicationPreference,
            marketingOptIn: data.marketingOptIn,
            relatedClientId: data.relatedClientId ?? null,
            groupId: data.groupId ?? null,
            groupName: data.groupName ?? null,
            notes: data.notes ?? null,
            returningGuest: data.returningGuest,
            isVip: data.isVip,
          })
          .returning({ id: contacts.id })

        const id = inserted[0]!.id
        const row = await fetchContactRow(tx, id)
        if (!row) return err("INTERNAL", "Could not load the new contact.")

        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: id,
          action: "create",
          newValue: { clientNumber, firstName: data.firstName, lastName: data.lastName },
        })

        return ok(row)
      } catch (e) {
        if (isUniqueViolation(e)) {
          return err("CONFLICT", "Could not assign a client number. Try again.")
        }
        return err("INTERNAL", "Could not create the contact.")
      }
    }),
  )
}

export async function updateContact(
  contactId: string,
  input: UpdateContactInput,
): Promise<ActionResult<ContactRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.update, ctx, async () => {
      const parsed = updateContactSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      const scope = ctx.propertyId
        ? and(eq(contacts.id, contactId), eq(contacts.propertyId, ctx.propertyId))
        : eq(contacts.id, contactId)

      const existing = await tx
        .select({ id: contacts.id, clientNumber: contacts.clientNumber })
        .from(contacts)
        .where(scope)
        .limit(1)
      if (!existing[0]) return err("NOT_FOUND", "That contact no longer exists.")

      try {
        await tx
          .update(contacts)
          .set({
            contactType: data.contactType,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email ?? null,
            phone: data.phone ?? null,
            addressStreet: data.addressStreet ?? null,
            addressSuburb: data.addressSuburb ?? null,
            addressCity: data.addressCity ?? null,
            addressPostcode: data.addressPostcode ?? null,
            addressCountry: data.addressCountry ?? "AU",
            birthday: parseBirthday(data.birthday),
            communicationPreference: data.communicationPreference,
            marketingOptIn: data.marketingOptIn,
            relatedClientId: data.relatedClientId ?? null,
            groupId: data.groupId ?? null,
            groupName: data.groupName ?? null,
            notes: data.notes ?? null,
            returningGuest: data.returningGuest,
            isVip: data.isVip,
            updatedAt: new Date(),
          })
          .where(scope)

        const row = await fetchContactRow(tx, contactId)
        if (!row) return err("NOT_FOUND", "That contact no longer exists.")

        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: contactId,
          action: "update",
          oldValue: existing[0],
          newValue: {
            firstName: data.firstName,
            lastName: data.lastName,
            clientNumber: existing[0].clientNumber,
          },
        })

        return ok(row)
      } catch {
        return err("INTERNAL", "Could not update the contact.")
      }
    }),
  )
}
