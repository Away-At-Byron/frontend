import "server-only"

import { alias } from "drizzle-orm/pg-core"
import { asc, eq } from "drizzle-orm"
import {
  contacts,
  properties,
  propertyAmenities,
  propertyAmenityAssignments,
  users,
} from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type {
  ManagerOption,
  OwnerOption,
  PropertyDetail,
  PropertyRow,
} from "./types"

/**
 * List properties visible to the signed-in user. Admin sees every
 * property; a tenanted user sees only their own (the `properties` table
 * is the multi-tenant boundary and has no RLS - scope here).
 */
export async function listProperties(): Promise<ActionResult<PropertyRow[]>> {
  return withTenant(async (tx, ctx) => {
    const base = tx
      .select({
        id: properties.id,
        name: properties.name,
        addressStreet: properties.addressStreet,
        addressSuburb: properties.addressSuburb,
        addressCity: properties.addressCity,
        addressPostcode: properties.addressPostcode,
        numberOfRooms: properties.numberOfRooms,
        propertyColour: properties.propertyColour,
        status: properties.status,
      })
      .from(properties)

    const rows =
      ctx.role === "admin" || !ctx.propertyId
        ? await base.orderBy(asc(properties.name))
        : await base
            .where(eq(properties.id, ctx.propertyId))
            .orderBy(asc(properties.name))

    return ok(
      rows.map((r) => ({
        ...r,
        numberOfRooms: r.numberOfRooms ?? 0,
      })),
    )
  })
}

/**
 * Full property record for the Edit page. Joins users (manager) and
 * contacts (owners 1 + 2) so the page renders without follow-up calls.
 * Returns NOT_FOUND when the property does not exist or the caller is
 * scoped to a different property.
 */
export async function getProperty(
  id: string,
): Promise<ActionResult<PropertyDetail>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.propertyId && ctx.propertyId !== id) {
      return err("FORBIDDEN", "You can't view that property.")
    }

    const owner1 = alias(contacts, "owner1")
    const owner2 = alias(contacts, "owner2")
    const mgr = alias(users, "mgr")

    const rows = await tx
      .select({
        id: properties.id,
        name: properties.name,
        addressStreet: properties.addressStreet,
        addressSuburb: properties.addressSuburb,
        addressCity: properties.addressCity,
        addressState: properties.addressState,
        addressPostcode: properties.addressPostcode,
        addressCountry: properties.addressCountry,
        numberOfRooms: properties.numberOfRooms,
        propertyColour: properties.propertyColour,
        status: properties.status,
        taxNumber: properties.taxNumber,
        website: properties.website,

        propertyManagerUserId: properties.propertyManagerUserId,
        onCallNumber: properties.onCallNumber,
        propertyEmail: properties.propertyEmail,
        lockboxAccess: properties.lockboxAccess,
        wifiNetwork: properties.wifiNetwork,

        owner1ContactId: properties.owner1ContactId,
        owner2ContactId: properties.owner2ContactId,

        mgrFirst: mgr.firstName,
        mgrLast: mgr.lastName,

        owner1First: owner1.firstName,
        owner1Last: owner1.lastName,
        owner1Email: owner1.email,
        owner1Phone: owner1.phone,

        owner2First: owner2.firstName,
        owner2Last: owner2.lastName,
        owner2Email: owner2.email,
        owner2Phone: owner2.phone,
      })
      .from(properties)
      .leftJoin(mgr, eq(mgr.id, properties.propertyManagerUserId))
      .leftJoin(owner1, eq(owner1.id, properties.owner1ContactId))
      .leftJoin(owner2, eq(owner2.id, properties.owner2ContactId))
      .where(eq(properties.id, id))
      .limit(1)

    const r = rows[0]
    if (!r) return err("NOT_FOUND", "That property no longer exists.")

    const fullName = (f: string | null, l: string | null): string | null => {
      const a = (f ?? "").trim()
      const b = (l ?? "").trim()
      const joined = [a, b].filter(Boolean).join(" ")
      return joined || null
    }

    const detail: PropertyDetail = {
      id: r.id,
      name: r.name,
      addressStreet: r.addressStreet,
      addressSuburb: r.addressSuburb,
      addressCity: r.addressCity,
      addressState: r.addressState,
      addressPostcode: r.addressPostcode,
      addressCountry: r.addressCountry,
      numberOfRooms: r.numberOfRooms ?? 0,
      propertyColour: r.propertyColour,
      status: r.status,
      taxNumber: r.taxNumber,
      website: r.website,
      propertyManagerUserId: r.propertyManagerUserId,
      propertyManagerName: fullName(r.mgrFirst, r.mgrLast),
      onCallNumber: r.onCallNumber,
      propertyEmail: r.propertyEmail,
      lockboxAccess: r.lockboxAccess,
      wifiNetwork: r.wifiNetwork,
      owner1ContactId: r.owner1ContactId,
      owner1Name: fullName(r.owner1First, r.owner1Last),
      owner1Email: r.owner1Email,
      owner1Phone: r.owner1Phone,
      owner2ContactId: r.owner2ContactId,
      owner2Name: fullName(r.owner2First, r.owner2Last),
      owner2Email: r.owner2Email,
      owner2Phone: r.owner2Phone,
    }
    return ok(detail)
  })
}

/** Active users available as a Property manager. Admin-only. */
export async function listManagerOptions(): Promise<
  ActionResult<ManagerOption[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can change property managers.")
    }
    const rows = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.status, "active"))
      .orderBy(asc(users.firstName), asc(users.lastName))

    return ok(
      rows.map((u) => ({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        email: u.email ?? null,
        phone: u.phone ?? null,
      })),
    )
  })
}

/** Contacts available as a Property owner (not deleted). Admin-only. */
export async function listOwnerOptions(): Promise<ActionResult<OwnerOption[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can change property owners.")
    }
    const rows = await tx
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
      })
      .from(contacts)
      .where(eq(contacts.isDeleted, false))
      .orderBy(asc(contacts.firstName), asc(contacts.lastName))

    return ok(
      rows.map((c) => ({
        id: c.id,
        name: [c.firstName, c.lastName].filter(Boolean).join(" "),
        email: c.email ?? null,
        phone: c.phone ?? null,
      })),
    )
  })
}

/**
 * Active amenity catalogue for the Edit Property amenities picker. Returned
 * sorted by category then sortOrder then name, which the panel relies on to
 * stream rows directly into category groups without re-sorting. Not gated
 * by role - the page itself enforces module access, and the catalogue is
 * non-sensitive label data.
 */
export async function listAmenityCatalogue(): Promise<
  ActionResult<{ id: string; category: string; name: string; sortOrder: number }[]>
> {
  return withTenant(async (tx) => {
    const rows = await tx
      .select({
        id: propertyAmenities.id,
        category: propertyAmenities.category,
        name: propertyAmenities.name,
        sortOrder: propertyAmenities.sortOrder,
      })
      .from(propertyAmenities)
      .where(eq(propertyAmenities.isDeleted, false))
      .orderBy(
        asc(propertyAmenities.category),
        asc(propertyAmenities.sortOrder),
        asc(propertyAmenities.name),
      )
    return ok(rows)
  })
}

/** Amenity IDs currently assigned to a property. */
export async function listPropertyAmenityIds(
  propertyId: string,
): Promise<ActionResult<string[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.propertyId && ctx.propertyId !== propertyId) {
      return err("FORBIDDEN", "You can't view that property.")
    }
    const rows = await tx
      .select({
        propertyAmenityId: propertyAmenityAssignments.propertyAmenityId,
      })
      .from(propertyAmenityAssignments)
      .where(eq(propertyAmenityAssignments.propertyId, propertyId))

    return ok(rows.map((r) => r.propertyAmenityId))
  })
}
