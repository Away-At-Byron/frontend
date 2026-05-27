"use server"

import { and, eq, inArray, sql } from "drizzle-orm"
import { contacts, contactTypes, contactSources, guestTypes, groups } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
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
import {
  contactSelection,
  mapContactRow,
  listGroupMembers,
  type GroupMember,
} from "./queries"

/** Contact type name applied when adding a related contact to a group. */
const SECONDARY_GROUP_MEMBER_TYPE = "Guest - Group Standard"
const PRIMARY_GROUP_MEMBER_TYPE = "Guest - Group Primary"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "23505"
  )
}

/**
 * Government ID fields are guests only. `contact_type` is now a FK, so this
 * can't be a DB CHECK — enforce it here by reading the type name. Returns an
 * error result if `idType` is set on a non-guest type.
 */
async function assertGuestForId(
  tx: Tx,
  contactTypeId: string | undefined,
  idType: string | undefined,
): Promise<ActionResult<true>> {
  if (!idType) return ok(true)
  if (!contactTypeId) {
    return err("VALIDATION", "ID details are for guest contacts only.", {
      idType: ["Set a guest contact type first"],
    })
  }
  const rows = await tx
    .select({ name: contactTypes.name })
    .from(contactTypes)
    .where(eq(contactTypes.id, contactTypeId))
    .limit(1)
  if (!rows[0]?.name.startsWith("Guest")) {
    return err("VALIDATION", "ID details are for guest contacts only.", {
      idType: ["Only guest contacts can hold ID details"],
    })
  }
  return ok(true)
}

async function fetchContactRow(tx: Tx, id: string): Promise<ContactRow | null> {
  const rows = await tx
    .select(contactSelection)
    .from(contacts)
    .leftJoin(contactTypes, eq(contacts.contactTypeId, contactTypes.id))
    .leftJoin(contactSources, eq(contacts.contactSourceId, contactSources.id))
    .leftJoin(guestTypes, eq(contacts.guestTypeId, guestTypes.id))
    .leftJoin(groups, eq(contacts.groupId, groups.id))
    .where(eq(contacts.id, id))
    .limit(1)
  const r = rows[0]
  return r ? mapContactRow(r) : null
}

/** Column values shared by create + update, derived from validated input. */
function contactValues(data: CreateContactInput) {
  return {
    contactTypeId: data.contactTypeId ?? null,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email ?? null,
    phone: data.phone ?? null,
    addressStreet: data.addressStreet ?? null,
    addressSuburb: data.addressSuburb ?? null,
    addressCity: data.addressCity ?? null,
    addressState: data.addressState ?? null,
    addressPostcode: data.addressPostcode ?? null,
    addressCountry: data.addressCountry ?? "AU",
    birthday: data.birthday ?? null,
    communicationPreference: data.communicationPreference,
    marketingOptIn: data.marketingOptIn,
    groupId: data.groupId ?? null,
    notes: data.notes ?? null,
    returningGuest: data.returningGuest,
    idType: data.idType ?? null,
    idNumber: data.idNumber ?? null,
    idCountry: data.idCountry ?? null,
    idVerified: data.idVerified,
    idVerificationDate: data.idVerificationDate ?? null,
    firstBookingDate: data.firstBookingDate ?? null,
    preferredBookingChannel: data.preferredBookingChannel ?? null,
    specialRequests: data.specialRequests ?? null,
    accessibilityRequirements: data.accessibilityRequirements ?? null,
    lastContactDate: data.lastContactDate ?? null,
    doNotRebook: data.doNotRebook,
    tier: data.tier ?? null,
    contactSourceId: data.contactSourceId ?? null,
    guestTypeId: data.guestTypeId ?? null,
    portalEnabled: data.portalEnabled,
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

      const guestCheck = await assertGuestForId(tx, data.contactTypeId, data.idType)
      if (!guestCheck.ok) return guestCheck

      try {
        const inserted = await tx
          .insert(contacts)
          .values({ ...contactValues(data), createdBy: ctx.userId })
          .returning({ id: contacts.id })

        const id = inserted[0]!.id
        const row = await fetchContactRow(tx, id)
        if (!row) return err("INTERNAL", "Could not load the new contact.")

        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: id,
          action: "create",
          newValue: { firstName: data.firstName, lastName: data.lastName },
        })

        return ok(row)
      } catch (e) {
        if (isUniqueViolation(e)) {
          return err("CONFLICT", "A contact with that email already exists.")
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

      const guestCheck = await assertGuestForId(tx, data.contactTypeId, data.idType)
      if (!guestCheck.ok) return guestCheck

      const existing = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1)
      if (!existing[0]) return err("NOT_FOUND", "That contact no longer exists.")

      try {
        await tx
          .update(contacts)
          .set({ ...contactValues(data), updatedAt: new Date() })
          .where(eq(contacts.id, contactId))

        const row = await fetchContactRow(tx, contactId)
        if (!row) return err("NOT_FOUND", "That contact no longer exists.")

        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: contactId,
          action: "update",
          newValue: { firstName: data.firstName, lastName: data.lastName },
        })

        return ok(row)
      } catch (e) {
        if (isUniqueViolation(e)) {
          return err("CONFLICT", "A contact with that email already exists.")
        }
        return err("INTERNAL", "Could not update the contact.")
      }
    }),
  )
}

/**
 * Soft delete — flips `is_deleted` so historical bookings and FK references
 * to this contact stay intact (mirrors `deleteContactType`).
 */
export async function deleteContact(
  contactId: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.delete, ctx, async () => {
      const existing = await tx
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
        })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
        .limit(1)
      if (!existing[0]) {
        return err("NOT_FOUND", "That contact no longer exists.")
      }

      await tx
        .update(contacts)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(contacts.id, contactId))

      await writeAudit({
        ctx,
        entityType: "contact",
        entityId: contactId,
        action: "delete",
        oldValue: {
          firstName: existing[0].firstName,
          lastName: existing[0].lastName,
        },
      })

      return ok({ id: contactId })
    }),
  )
}

/** Client-callable wrapper around listGroupMembers; used by the contact
 * detail page to refresh the Group section when the user picks a different
 * group before saving. */
export async function getGroupMembersAction(
  groupId: string,
): Promise<ActionResult<GroupMember[]>> {
  return listGroupMembers(groupId)
}

/**
 * Add a set of existing contacts to `groupId` as "Guest - Group Standard"
 * secondaries. Backs the multi-select "Related contacts" picker on the
 * Profile tab — picking N contacts there means "drop them into this group as
 * standard members" rather than persisting a link on the current contact.
 *
 * Idempotent: ids already in the group with the same type are still updated
 * (same values) and excluded contacts (the group's primary, the current
 * contact itself) must be filtered by the caller.
 */
export async function addContactsToGroup(input: {
  groupId: string
  contactIds: string[]
}): Promise<ActionResult<{ updatedIds: string[] }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.update, ctx, async () => {
      const ids = Array.from(
        new Set(input.contactIds.filter((id) => typeof id === "string" && id)),
      )
      if (ids.length === 0) return ok({ updatedIds: [] })

      const groupRow = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.id, input.groupId), eq(groups.isDeleted, false)))
        .limit(1)
      if (!groupRow[0]) {
        return err("NOT_FOUND", "That group no longer exists.")
      }

      const typeRow = await tx
        .select({ id: contactTypes.id })
        .from(contactTypes)
        .where(
          and(
            eq(contactTypes.isDeleted, false),
            sql`lower(${contactTypes.name}) = lower(${SECONDARY_GROUP_MEMBER_TYPE})`,
          ),
        )
        .limit(1)
      if (!typeRow[0]) {
        return err(
          "VALIDATION",
          `Contact type "${SECONDARY_GROUP_MEMBER_TYPE}" is missing. Create it in Settings first.`,
        )
      }

      const updated = await tx
        .update(contacts)
        .set({
          groupId: input.groupId,
          contactTypeId: typeRow[0].id,
          updatedAt: new Date(),
        })
        .where(and(inArray(contacts.id, ids), eq(contacts.isDeleted, false)))
        .returning({ id: contacts.id })

      for (const c of updated) {
        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: c.id,
          action: "update",
          newValue: {
            groupId: input.groupId,
            contactTypeName: SECONDARY_GROUP_MEMBER_TYPE,
          },
        })
      }

      return ok({ updatedIds: updated.map((c) => c.id) })
    }),
  )
}

/**
 * Make `newPrimaryId` the group's "Guest - Group Primary" and demote any
 * existing primary in the same group to "Guest - Group Standard". Pass
 * `excludeContactIds` for contacts the caller will update locally instead
 * (typically the current edited contact, whose type lives in unsaved form
 * state). Returns the two type ids so the client can mirror the change in
 * form state.
 */
export async function setGroupPrimary(input: {
  groupId: string
  newPrimaryId: string
  excludeContactIds?: string[]
}): Promise<
  ActionResult<{ primaryTypeId: string; standardTypeId: string }>
> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.update, ctx, async () => {
      const exclude = new Set(input.excludeContactIds ?? [])

      const typeRows = await tx
        .select({ id: contactTypes.id, name: contactTypes.name })
        .from(contactTypes)
        .where(
          and(
            eq(contactTypes.isDeleted, false),
            sql`lower(${contactTypes.name}) in (lower(${PRIMARY_GROUP_MEMBER_TYPE}), lower(${SECONDARY_GROUP_MEMBER_TYPE}))`,
          ),
        )
      const primaryType = typeRows.find(
        (t) => t.name.toLowerCase() === PRIMARY_GROUP_MEMBER_TYPE.toLowerCase(),
      )
      const standardType = typeRows.find(
        (t) =>
          t.name.toLowerCase() === SECONDARY_GROUP_MEMBER_TYPE.toLowerCase(),
      )
      if (!primaryType || !standardType) {
        return err(
          "VALIDATION",
          `Contact types "${PRIMARY_GROUP_MEMBER_TYPE}" and "${SECONDARY_GROUP_MEMBER_TYPE}" must exist.`,
        )
      }

      const currentPrimaries = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(
          and(
            eq(contacts.groupId, input.groupId),
            eq(contacts.isDeleted, false),
            eq(contacts.contactTypeId, primaryType.id),
          ),
        )

      const demoteIds = currentPrimaries
        .map((r) => r.id)
        .filter((id) => id !== input.newPrimaryId && !exclude.has(id))
      if (demoteIds.length > 0) {
        await tx
          .update(contacts)
          .set({ contactTypeId: standardType.id, updatedAt: new Date() })
          .where(inArray(contacts.id, demoteIds))
        for (const id of demoteIds) {
          await writeAudit({
            ctx,
            entityType: "contact",
            entityId: id,
            action: "update",
            newValue: { contactTypeName: SECONDARY_GROUP_MEMBER_TYPE },
          })
        }
      }

      if (!exclude.has(input.newPrimaryId)) {
        const promoted = await tx
          .update(contacts)
          .set({ contactTypeId: primaryType.id, updatedAt: new Date() })
          .where(
            and(
              eq(contacts.id, input.newPrimaryId),
              eq(contacts.groupId, input.groupId),
              eq(contacts.isDeleted, false),
            ),
          )
          .returning({ id: contacts.id })
        if (!promoted[0]) {
          return err("NOT_FOUND", "That contact isn't in this group.")
        }
        await writeAudit({
          ctx,
          entityType: "contact",
          entityId: input.newPrimaryId,
          action: "update",
          newValue: { contactTypeName: PRIMARY_GROUP_MEMBER_TYPE },
        })
      }

      return ok({
        primaryTypeId: primaryType.id,
        standardTypeId: standardType.id,
      })
    }),
  )
}
