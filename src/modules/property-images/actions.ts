"use server"

import { and, eq, sql } from "drizzle-orm"
import { properties, propertyImages } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionErr, type ActionResult } from "@/lib/result"
import {
  buildPropertyImageKey,
  deleteObject,
  headObjectInfo,
  MAX_FILE_BYTES,
  presignUpload,
  type PresignedUpload,
} from "@/lib/storage"
import {
  commitPropertyImageSchema,
  presignPropertyImageSchema,
  updatePropertyImageSchema,
  type CommitPropertyImageInput,
  type PresignPropertyImageInput,
  type UpdatePropertyImageInput,
} from "./schemas"
import type { PropertyImageRow } from "./types"
import { presignDownload } from "@/lib/storage"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can change property images.")
  }
  return null
}

async function assertProperty(
  tx: Tx,
  propertyId: string,
): Promise<ActionResult<true>> {
  const rows = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1)
  if (!rows[0]) return err("NOT_FOUND", "That property no longer exists.")
  return ok(true)
}

/**
 * Step 1. Hand the client a short-lived signed PUT URL bound to the
 * generated key. The client uploads bytes straight to MinIO, then calls
 * `commitPropertyImage` so the row lands in the same transaction as the
 * audit entry.
 */
export async function presignPropertyImageUpload(
  input: PresignPropertyImageInput,
): Promise<ActionResult<PresignedUpload & { key: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = presignPropertyImageSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { propertyId, role, fileName, mimeType, sizeBytes } = parsed.data

    const propCheck = await assertProperty(tx, propertyId)
    if (!propCheck.ok) return propCheck

    const key = buildPropertyImageKey(propertyId, role, fileName)
    const signed = await presignUpload({
      key,
      contentType: mimeType,
      contentLength: sizeBytes,
    })
    return ok(signed)
  })
}

/**
 * Step 2. Verify the byte upload succeeded, then write the row. For `logo`
 * and `hero` we soft-delete any existing active row first - the partial
 * unique indexes (one logo/one hero per property) would otherwise reject
 * the insert. The MinIO object the old row pointed to is dropped too.
 */
export async function commitPropertyImage(
  input: CommitPropertyImageInput,
): Promise<ActionResult<PropertyImageRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = commitPropertyImageSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const v = parsed.data

    // Key sanity — stops a client confirming an object outside this property's
    // prefix (would not have been presigned for it).
    const expectedPrefix = `properties/${v.propertyId}/images/${v.role}/`
    if (!v.key.startsWith(expectedPrefix)) {
      return err("VALIDATION", "Upload key doesn't belong to this property.")
    }

    const propCheck = await assertProperty(tx, v.propertyId)
    if (!propCheck.ok) return propCheck

    // Verify the byte upload completed at the size we approved.
    const head = await headObjectInfo(v.key)
    if (!head.exists) {
      return err("VALIDATION", "Upload didn't complete. Try again.")
    }
    if (head.contentLength !== null && head.contentLength !== v.sizeBytes) {
      return err("VALIDATION", "Uploaded file is a different size than expected.")
    }
    if (head.contentLength !== null && head.contentLength > MAX_FILE_BYTES) {
      return err("VALIDATION", "Uploaded file is over the size limit.")
    }

    // For logo/hero, replace the active row. Soft-delete the old DB row and
    // remove the old bytes from MinIO so we don't accumulate orphans.
    let nextSort = 0
    if (v.role === "logo" || v.role === "hero") {
      const previous = await tx
        .select({ id: propertyImages.id, fileKey: propertyImages.fileKey })
        .from(propertyImages)
        .where(
          and(
            eq(propertyImages.propertyId, v.propertyId),
            eq(propertyImages.role, v.role),
            eq(propertyImages.isDeleted, false),
          ),
        )
      if (previous.length > 0) {
        await tx
          .update(propertyImages)
          .set({ isDeleted: true })
          .where(
            and(
              eq(propertyImages.propertyId, v.propertyId),
              eq(propertyImages.role, v.role),
              eq(propertyImages.isDeleted, false),
            ),
          )
        // Best-effort delete; if MinIO is down we'd rather keep the new row
        // than block the user, and the bucket janitor sweeps orphans.
        await Promise.all(
          previous.map((p) =>
            deleteObject(p.fileKey).catch(() => undefined),
          ),
        )
      }
    } else {
      const maxRow = await tx
        .select({
          max: sql<number | null>`max(${propertyImages.sortOrder})`,
        })
        .from(propertyImages)
        .where(
          and(
            eq(propertyImages.propertyId, v.propertyId),
            eq(propertyImages.role, "gallery"),
            eq(propertyImages.isDeleted, false),
          ),
        )
      nextSort = (maxRow[0]?.max ?? -1) + 1
    }

    const inserted = await tx
      .insert(propertyImages)
      .values({
        propertyId: v.propertyId,
        role: v.role,
        fileKey: v.key,
        mimeType: v.mimeType,
        sizeBytes: v.sizeBytes,
        widthPx: v.widthPx ?? null,
        heightPx: v.heightPx ?? null,
        caption: v.caption ?? null,
        sortOrder: nextSort,
        uploadedBy: ctx.userId,
      })
      .returning()

    const row = inserted[0]!

    await writeAudit({
      ctx,
      entityType: "property_image",
      entityId: row.id,
      action: "create",
      newValue: {
        propertyId: row.propertyId,
        role: row.role,
        fileKey: row.fileKey,
        sizeBytes: row.sizeBytes,
      },
    })

    return ok({
      id: row.id,
      propertyId: row.propertyId,
      role: row.role,
      fileKey: row.fileKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      widthPx: row.widthPx,
      heightPx: row.heightPx,
      caption: row.caption,
      sortOrder: row.sortOrder,
      uploadedAt: row.uploadedAt.toISOString(),
      downloadUrl: await presignDownload(row.fileKey),
    })
  })
}

export async function updatePropertyImage(
  id: string,
  input: UpdatePropertyImageInput,
): Promise<ActionResult<{ id: string; caption: string | null }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updatePropertyImageSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select({ id: propertyImages.id })
      .from(propertyImages)
      .where(
        and(eq(propertyImages.id, id), eq(propertyImages.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That image no longer exists.")
    }

    const caption = parsed.data.caption ?? null
    await tx
      .update(propertyImages)
      .set({ caption })
      .where(eq(propertyImages.id, id))

    await writeAudit({
      ctx,
      entityType: "property_image",
      entityId: id,
      action: "update",
      newValue: { caption },
    })

    return ok({ id, caption })
  })
}

export async function deletePropertyImage(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const rows = await tx
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
        role: propertyImages.role,
        fileKey: propertyImages.fileKey,
      })
      .from(propertyImages)
      .where(
        and(eq(propertyImages.id, id), eq(propertyImages.isDeleted, false)),
      )
      .limit(1)
    const existing = rows[0]
    if (!existing) {
      return err("NOT_FOUND", "That image no longer exists.")
    }

    await tx
      .update(propertyImages)
      .set({ isDeleted: true })
      .where(eq(propertyImages.id, id))

    // Drop the bytes too. Best-effort: a missing object isn't an error.
    await deleteObject(existing.fileKey).catch(() => undefined)

    await writeAudit({
      ctx,
      entityType: "property_image",
      entityId: id,
      action: "delete",
      oldValue: {
        propertyId: existing.propertyId,
        role: existing.role,
        fileKey: existing.fileKey,
      },
    })

    return ok({ id })
  })
}

/**
 * Move a gallery image one slot up or down. Logo and hero are singletons -
 * reordering is a no-op for them.
 */
export async function reorderPropertyImage(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const rows = await tx
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
        role: propertyImages.role,
        sortOrder: propertyImages.sortOrder,
      })
      .from(propertyImages)
      .where(
        and(eq(propertyImages.id, id), eq(propertyImages.isDeleted, false)),
      )
      .limit(1)
    const current = rows[0]
    if (!current) return err("NOT_FOUND", "That image no longer exists.")
    if (current.role !== "gallery") return ok({ id })

    const peer = await tx
      .select({
        id: propertyImages.id,
        sortOrder: propertyImages.sortOrder,
      })
      .from(propertyImages)
      .where(
        and(
          eq(propertyImages.propertyId, current.propertyId),
          eq(propertyImages.role, "gallery"),
          eq(propertyImages.isDeleted, false),
          direction === "up"
            ? sql`${propertyImages.sortOrder} < ${current.sortOrder}`
            : sql`${propertyImages.sortOrder} > ${current.sortOrder}`,
        ),
      )
      .orderBy(
        direction === "up"
          ? sql`${propertyImages.sortOrder} DESC`
          : sql`${propertyImages.sortOrder} ASC`,
      )
      .limit(1)
    if (!peer[0]) return ok({ id }) // already at the boundary

    // Park current at a sentinel so swapping doesn't collide on any future
    // (property_id, role, sort_order) unique constraint.
    await tx
      .update(propertyImages)
      .set({ sortOrder: -1 })
      .where(eq(propertyImages.id, id))
    await tx
      .update(propertyImages)
      .set({ sortOrder: current.sortOrder })
      .where(eq(propertyImages.id, peer[0].id))
    await tx
      .update(propertyImages)
      .set({ sortOrder: peer[0].sortOrder })
      .where(eq(propertyImages.id, id))

    return ok({ id })
  })
}
