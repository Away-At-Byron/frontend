"use server"

import { and, eq, inArray, sql } from "drizzle-orm"
import {
  properties,
  propertyAmenities,
  propertyAmenityAssignments,
} from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createPropertySchema,
  setPropertyAmenitiesSchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type SetPropertyAmenitiesInput,
  type UpdatePropertyInput,
} from "./schemas"
import type { PropertyDetail } from "./types"
import { getProperty } from "./queries"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage properties.")
  }
  return null
}

async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const rows = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(
      and(
        sql`lower(${properties.name}) = lower(${name})`,
        exceptId ? sql`${properties.id} <> ${exceptId}` : undefined,
      ),
    )
    .limit(1)
  return rows.length > 0
}

export async function createProperty(
  input: CreatePropertyInput,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createPropertySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const v = parsed.data

    if (await nameTaken(tx, v.name)) {
      return err("CONFLICT", "A property with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(properties)
      .values({
        name: v.name,
        addressStreet: v.addressStreet,
        addressSuburb: v.addressSuburb,
        addressCity: v.addressCity,
        addressState: v.addressState,
        addressPostcode: v.addressPostcode,
        addressCountry: v.addressCountry,
        propertyColour: v.propertyColour,
        status: v.status,
      })
      .returning({ id: properties.id })

    const id = inserted[0]!.id

    await writeAudit({
      ctx,
      entityType: "property",
      entityId: id,
      action: "create",
      newValue: v,
    })

    return ok({ id })
  })
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
): Promise<ActionResult<PropertyDetail>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updatePropertySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const v = parsed.data

    const existing = await tx
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That property no longer exists.")
    }

    if (await nameTaken(tx, v.name, id)) {
      return err("CONFLICT", "A property with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(properties)
      .set({
        name: v.name,
        addressStreet: v.addressStreet,
        addressSuburb: v.addressSuburb,
        addressCity: v.addressCity,
        addressState: v.addressState,
        addressPostcode: v.addressPostcode,
        addressCountry: v.addressCountry,
        propertyColour: v.propertyColour,
        status: v.status,
        taxNumber: v.taxNumber,
        website: v.website,
        propertyManagerUserId: v.propertyManagerUserId,
        onCallNumber: v.onCallNumber,
        propertyEmail: v.propertyEmail,
        lockboxAccess: v.lockboxAccess,
        wifiNetwork: v.wifiNetwork,
        owner1ContactId: v.owner1ContactId,
        owner2ContactId: v.owner2ContactId,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))

    await writeAudit({
      ctx,
      entityType: "property",
      entityId: id,
      action: "update",
      newValue: v,
    })

    const fresh = await getProperty(id)
    if (!fresh.ok) return fresh
    return ok(fresh.data)
  })
}

/**
 * Replace the property's amenity assignment set in one round-trip. Validates
 * that every passed amenity id exists and is not soft-deleted, then deletes
 * the rows the caller dropped and inserts the rows they added.
 */
export async function setPropertyAmenities(
  propertyId: string,
  input: SetPropertyAmenitiesInput,
): Promise<ActionResult<{ amenityIds: string[] }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = setPropertyAmenitiesSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const wanted = Array.from(new Set(parsed.data.amenityIds))

    const exists = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)
    if (!exists[0]) {
      return err("NOT_FOUND", "That property no longer exists.")
    }

    if (wanted.length > 0) {
      const valid = await tx
        .select({ id: propertyAmenities.id })
        .from(propertyAmenities)
        .where(
          and(
            inArray(propertyAmenities.id, wanted),
            eq(propertyAmenities.isDeleted, false),
          ),
        )
      if (valid.length !== wanted.length) {
        return err("VALIDATION", "One or more amenities no longer exist.")
      }
    }

    const current = await tx
      .select({
        propertyAmenityId: propertyAmenityAssignments.propertyAmenityId,
      })
      .from(propertyAmenityAssignments)
      .where(eq(propertyAmenityAssignments.propertyId, propertyId))
    const currentSet = new Set(current.map((r) => r.propertyAmenityId))
    const wantedSet = new Set(wanted)

    const toRemove = [...currentSet].filter((x) => !wantedSet.has(x))
    const toAdd = wanted.filter((x) => !currentSet.has(x))

    if (toRemove.length > 0) {
      await tx
        .delete(propertyAmenityAssignments)
        .where(
          and(
            eq(propertyAmenityAssignments.propertyId, propertyId),
            inArray(propertyAmenityAssignments.propertyAmenityId, toRemove),
          ),
        )
    }

    if (toAdd.length > 0) {
      await tx.insert(propertyAmenityAssignments).values(
        toAdd.map((amenityId) => ({
          propertyId,
          propertyAmenityId: amenityId,
        })),
      )
    }

    await writeAudit({
      ctx,
      entityType: "property",
      entityId: propertyId,
      action: "update",
      oldValue: { amenityIds: [...currentSet] },
      newValue: { amenityIds: wanted },
    })

    return ok({ amenityIds: wanted })
  })
}
