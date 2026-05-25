"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { contacts, groups } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult } from "@/lib/result"
import { CONTACT_PERMISSIONS } from "./permissions"
import {
  createGroupSchema,
  updateGroupSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
} from "./schemas"
import type { GroupRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

/** Read one group with its live member count. */
async function fetchGroupRow(tx: Tx, id: string): Promise<GroupRow | null> {
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
    .where(eq(groups.id, id))
    .groupBy(groups.id)
    .limit(1)
  const row = rows[0]
  return row ? { ...row, createdAt: row.createdAt.toISOString() } : null
}

/** Case-insensitive uniqueness check on group_name among non-deleted rows. */
async function groupNameTaken(
  tx: Tx,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: groups.id })
    .from(groups)
    .where(
      and(
        eq(groups.isDeleted, false),
        sql`lower(${groups.groupName}) = lower(${name})`,
        exceptId ? ne(groups.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

export async function createGroup(
  input: CreateGroupInput,
): Promise<ActionResult<GroupRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.create, ctx, async () => {
      const parsed = createGroupSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      if (await groupNameTaken(tx, data.groupName)) {
        return err("CONFLICT", "A group with that name already exists.", {
          groupName: ["That name is already in use"],
        })
      }

      const inserted = await tx
        .insert(groups)
        .values({
          groupName: data.groupName,
          relationships: data.relationships ?? null,
          companyName: data.companyName ?? null,
          corporateAccountId: data.corporateAccountId ?? null,
          travelAgentId: data.travelAgentId ?? null,
          groupBookerFlag: data.groupBookerFlag,
          billingPreference: data.billingPreference ?? null,
          taxAbn: data.taxAbn ?? null,
          createdBy: ctx.userId,
        })
        .returning({ id: groups.id })

      const id = inserted[0]!.id
      const row = await fetchGroupRow(tx, id)
      if (!row) return err("INTERNAL", "Could not load the new group.")

      await writeAudit({
        ctx,
        entityType: "group",
        entityId: id,
        action: "create",
        newValue: data,
      })

      return ok(row)
    }),
  )
}

export async function updateGroup(
  id: string,
  input: UpdateGroupInput,
): Promise<ActionResult<GroupRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.update, ctx, async () => {
      const parsed = updateGroupSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      const existing = await tx
        .select()
        .from(groups)
        .where(and(eq(groups.id, id), eq(groups.isDeleted, false)))
        .limit(1)
      if (!existing[0]) {
        return err("NOT_FOUND", "That group no longer exists.")
      }

      if (await groupNameTaken(tx, data.groupName, id)) {
        return err("CONFLICT", "A group with that name already exists.", {
          groupName: ["That name is already in use"],
        })
      }

      await tx
        .update(groups)
        .set({
          groupName: data.groupName,
          relationships: data.relationships ?? null,
          companyName: data.companyName ?? null,
          corporateAccountId: data.corporateAccountId ?? null,
          travelAgentId: data.travelAgentId ?? null,
          groupBookerFlag: data.groupBookerFlag,
          billingPreference: data.billingPreference ?? null,
          taxAbn: data.taxAbn ?? null,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, id))

      const row = await fetchGroupRow(tx, id)
      if (!row) return err("NOT_FOUND", "That group no longer exists.")

      await writeAudit({
        ctx,
        entityType: "group",
        entityId: id,
        action: "update",
        oldValue: existing[0],
        newValue: data,
      })

      return ok(row)
    }),
  )
}

/**
 * Soft delete — flips `is_deleted`. Member contacts keep their `group_id`
 * reference so the historical link survives; the list query filters by
 * `is_deleted = false` so the row drops out of the UI.
 */
export async function deleteGroup(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_PERMISSIONS.delete, ctx, async () => {
      const existing = await tx
        .select({ id: groups.id, groupName: groups.groupName })
        .from(groups)
        .where(and(eq(groups.id, id), eq(groups.isDeleted, false)))
        .limit(1)
      if (!existing[0]) {
        return err("NOT_FOUND", "That group no longer exists.")
      }

      await tx
        .update(groups)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(groups.id, id))

      await writeAudit({
        ctx,
        entityType: "group",
        entityId: id,
        action: "delete",
        oldValue: { groupName: existing[0].groupName },
      })

      return ok({ id })
    }),
  )
}
