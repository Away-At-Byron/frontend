"use server"

import { and, count, eq, ne, sql } from "drizzle-orm"
import { contacts, contactSources } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createContactSourceSchema,
  updateContactSourceSchema,
  type CreateContactSourceInput,
  type UpdateContactSourceInput,
} from "./schemas"
import type { ContactSourceRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

/** Contact sources are an admin-only Settings catalogue. */
function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage contact sources.")
  }
  return null
}

/**
 * True when another active contact source already uses `name`
 * (case-insensitive). `exceptId` skips the row being updated.
 */
async function nameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: contactSources.id })
    .from(contactSources)
    .where(
      and(
        eq(contactSources.isDeleted, false),
        sql`lower(${contactSources.name}) = lower(${name})`,
        exceptId ? ne(contactSources.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/** Re-read a single source with its live contact count. */
async function fetchContactSourceRow(
  tx: Tx,
  id: string,
): Promise<ContactSourceRow | null> {
  const rows = await tx
    .select({
      id: contactSources.id,
      name: contactSources.name,
      createdAt: contactSources.createdAt,
      updatedAt: contactSources.updatedAt,
      contactCount: count(contacts.id),
    })
    .from(contactSources)
    .leftJoin(contacts, eq(contacts.contactSourceId, contactSources.id))
    .where(eq(contactSources.id, id))
    .groupBy(contactSources.id)
    .limit(1)
  return rows[0] ?? null
}

export async function createContactSource(
  input: CreateContactSourceInput,
): Promise<ActionResult<ContactSourceRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createContactSourceSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    if (await nameTaken(tx, name)) {
      return err("CONFLICT", "A contact source with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    const inserted = await tx
      .insert(contactSources)
      .values({ name, createdBy: ctx.userId })
      .returning({ id: contactSources.id })

    const id = inserted[0]!.id
    const row = await fetchContactSourceRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new contact source.")

    await writeAudit({
      ctx,
      entityType: "contact_source",
      entityId: id,
      action: "create",
      newValue: { name },
    })

    return ok(row)
  })
}

export async function updateContactSource(
  id: string,
  input: UpdateContactSourceInput,
): Promise<ActionResult<ContactSourceRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateContactSourceSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { name } = parsed.data

    const existing = await tx
      .select({ id: contactSources.id, name: contactSources.name })
      .from(contactSources)
      .where(and(eq(contactSources.id, id), eq(contactSources.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That contact source no longer exists.")
    }

    if (await nameTaken(tx, name, id)) {
      return err("CONFLICT", "A contact source with that name already exists.", {
        name: ["That name is already in use"],
      })
    }

    await tx
      .update(contactSources)
      .set({ name, updatedAt: new Date() })
      .where(eq(contactSources.id, id))

    const row = await fetchContactSourceRow(tx, id)
    if (!row) return err("NOT_FOUND", "That contact source no longer exists.")

    await writeAudit({
      ctx,
      entityType: "contact_source",
      entityId: id,
      action: "update",
      oldValue: { name: existing[0].name },
      newValue: { name },
    })

    return ok(row)
  })
}

/**
 * Soft delete — flips `is_deleted` so existing `contact_source_id` references
 * on historical contacts stay intact (see the schema comment).
 */
export async function deleteContactSource(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({ id: contactSources.id, name: contactSources.name })
      .from(contactSources)
      .where(and(eq(contactSources.id, id), eq(contactSources.isDeleted, false)))
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That contact source no longer exists.")
    }

    await tx
      .update(contactSources)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(contactSources.id, id))

    await writeAudit({
      ctx,
      entityType: "contact_source",
      entityId: id,
      action: "delete",
      oldValue: { name: existing[0].name },
    })

    return ok({ id })
  })
}
