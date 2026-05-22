"use server"

import { and, count, eq, ne, sql } from "drizzle-orm"
import { contacts, contactTypes } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createContactTypeSchema,
  updateContactTypeSchema,
  type CreateContactTypeInput,
  type UpdateContactTypeInput,
} from "./schemas"
import type { ContactTypeRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

/** Contact types are an admin-only Settings catalogue. */
function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage contact types.")
  }
  return null
}

/**
 * True when another active contact type already uses `name`
 * (case-insensitive). `exceptId` skips the row being updated.
 */
async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: contactTypes.id })
    .from(contactTypes)
    .where(
      and(
        eq(contactTypes.isDeleted, false),
        sql`lower(${contactTypes.name}) = lower(${name})`,
        exceptId ? ne(contactTypes.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/** Re-read a single type with its live contact count. */
async function fetchContactTypeRow(
  tx: Tx,
  id: string,
): Promise<ContactTypeRow | null> {
  const rows = await tx
    .select({
      id: contactTypes.id,
      name: contactTypes.name,
      createdAt: contactTypes.createdAt,
      updatedAt: contactTypes.updatedAt,
      contactCount: count(contacts.id),
    })
    .from(contactTypes)
    .leftJoin(contacts, eq(contacts.contactTypeId, contactTypes.id))
    .where(eq(contactTypes.id, id))
    .groupBy(contactTypes.id)
    .limit(1)
  return rows[0] ?? null
}

export async function createContactType(
  input: CreateContactTypeInput,
): Promise<ActionResult<ContactTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createContactTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A contact type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(contactTypes)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: contactTypes.id })

    const id = inserted[0]!.id
    const row = await fetchContactTypeRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new contact type.")

    await writeAudit({
      ctx,
      entityType: "contact_type",
      entityId: id,
      action: "create",
      newValue: { name },
    })

    return ok(row)
  })
}

export async function updateContactType(
  id: string,
  input: UpdateContactTypeInput,
): Promise<ActionResult<ContactTypeRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateContactTypeSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    const existing = await tx
      .select({ id: contactTypes.id, name: contactTypes.name })
      .from(contactTypes)
      .where(and(eq(contactTypes.id, id), eq(contactTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That contact type no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A contact type with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(contactTypes)
      .set({ name, updatedAt: new Date() })
      .where(eq(contactTypes.id, id))

    const row = await fetchContactTypeRow(tx, id)
    if (!row) return err("NOT_FOUND", "That contact type no longer exists.")

    await writeAudit({
      ctx,
      entityType: "contact_type",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
    })

    return ok(row)
  })
}

/**
 * Soft delete — flips `is_deleted` so existing `contact_type_id` references
 * on historical contacts stay intact (see the schema comment).
 */
export async function deleteContactType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: contactTypes.id, name: contactTypes.name })
      .from(contactTypes)
      .where(and(eq(contactTypes.id, id), eq(contactTypes.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That contact type no longer exists.")
    }

    await tx
      .update(contactTypes)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(contactTypes.id, id))

    await writeAudit({
      ctx,
      entityType: "contact_type",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
