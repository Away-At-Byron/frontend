"use server"

import { and, eq } from "drizzle-orm"
import { properties, propertyDocuments } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionErr, type ActionResult } from "@/lib/result"
import {
  buildPropertyDocumentKey,
  deleteObject,
  headObjectInfo,
  MAX_FILE_BYTES,
  presignUpload,
  presignDownload,
  type PresignedUpload,
} from "@/lib/storage"
import {
  confirmPropertyDocumentUploadsSchema,
  presignPropertyDocumentUploadsSchema,
  updatePropertyDocumentSchema,
  type ConfirmPropertyDocumentUploadsInput,
  type PresignPropertyDocumentUploadsInput,
  type UpdatePropertyDocumentInput,
} from "./schemas"
import type { PropertyDocumentRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can change property documents.")
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

export type PresignedUploadForFile = PresignedUpload & {
  fileName: string
  mimeType: string
  sizeBytes: number
}

/**
 * Step 1. Hand back one presigned PUT URL per file so the client can upload
 * in parallel without pinning the Next server.
 */
export async function presignPropertyDocumentUploads(
  input: PresignPropertyDocumentUploadsInput,
): Promise<ActionResult<PresignedUploadForFile[]>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = presignPropertyDocumentUploadsSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { propertyId, files } = parsed.data

    const propCheck = await assertProperty(tx, propertyId)
    if (!propCheck.ok) return propCheck

    const presigned: PresignedUploadForFile[] = await Promise.all(
      files.map(async (f) => {
        const key = buildPropertyDocumentKey(propertyId, f.fileName)
        const signed = await presignUpload({
          key,
          contentType: f.mimeType,
          contentLength: f.sizeBytes,
        })
        return {
          ...signed,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
        }
      }),
    )
    return ok(presigned)
  })
}

/**
 * Step 2. Verify every byte upload succeeded, then write the metadata rows in
 * one transaction. Each row also gets an audit entry.
 */
export async function confirmPropertyDocumentUploads(
  input: ConfirmPropertyDocumentUploadsInput,
): Promise<ActionResult<PropertyDocumentRow[]>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = confirmPropertyDocumentUploadsSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { propertyId, items } = parsed.data

    const propCheck = await assertProperty(tx, propertyId)
    if (!propCheck.ok) return propCheck

    const expectedPrefix = `properties/${propertyId}/documents/`
    for (const item of items) {
      if (!item.key.startsWith(expectedPrefix)) {
        return err(
          "VALIDATION",
          "One or more files don't belong to this property.",
        )
      }
    }

    const heads = await Promise.all(items.map((i) => headObjectInfo(i.key)))
    for (let i = 0; i < items.length; i++) {
      const head = heads[i]!
      const item = items[i]!
      if (!head.exists) {
        return err(
          "VALIDATION",
          `Upload for "${item.fileName}" didn't complete. Try again.`,
        )
      }
      if (head.contentLength !== null && head.contentLength !== item.sizeBytes) {
        return err(
          "VALIDATION",
          `"${item.fileName}" is a different size than expected.`,
        )
      }
      if (head.contentLength !== null && head.contentLength > MAX_FILE_BYTES) {
        return err("VALIDATION", `"${item.fileName}" is over the size limit.`)
      }
    }

    const inserted = await tx
      .insert(propertyDocuments)
      .values(
        items.map((i) => ({
          propertyId,
          title: i.title,
          description: i.description ?? null,
          fileKey: i.key,
          fileName: i.fileName,
          mimeType: i.mimeType,
          sizeBytes: i.sizeBytes,
          uploadedBy: ctx.userId,
        })),
      )
      .returning()

    for (const row of inserted) {
      await writeAudit({
        ctx,
        entityType: "property_document",
        entityId: row.id,
        action: "create",
        newValue: {
          propertyId,
          title: row.title,
          fileName: row.fileName,
          sizeBytes: row.sizeBytes,
        },
      })
    }

    return ok(
      await Promise.all(
        inserted.map(async (r) => ({
          id: r.id,
          propertyId: r.propertyId,
          title: r.title,
          description: r.description,
          fileKey: r.fileKey,
          fileName: r.fileName,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          uploadedBy: r.uploadedBy,
          uploadedByName: null,
          uploadedAt: r.uploadedAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          downloadUrl: await presignDownload(r.fileKey),
        })),
      ),
    )
  })
}

export async function updatePropertyDocument(
  id: string,
  input: UpdatePropertyDocumentInput,
): Promise<ActionResult<{ id: string; title: string; description: string | null }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updatePropertyDocumentSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }

    const existing = await tx
      .select({
        id: propertyDocuments.id,
        title: propertyDocuments.title,
        description: propertyDocuments.description,
      })
      .from(propertyDocuments)
      .where(
        and(
          eq(propertyDocuments.id, id),
          eq(propertyDocuments.isDeleted, false),
        ),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That document no longer exists.")
    }

    const description = parsed.data.description ?? null
    await tx
      .update(propertyDocuments)
      .set({
        title: parsed.data.title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(propertyDocuments.id, id))

    await writeAudit({
      ctx,
      entityType: "property_document",
      entityId: id,
      action: "update",
      oldValue: {
        title: existing[0].title,
        description: existing[0].description,
      },
      newValue: { title: parsed.data.title, description },
    })

    return ok({ id, title: parsed.data.title, description })
  })
}

export async function deletePropertyDocument(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const rows = await tx
      .select({
        id: propertyDocuments.id,
        propertyId: propertyDocuments.propertyId,
        title: propertyDocuments.title,
        fileKey: propertyDocuments.fileKey,
      })
      .from(propertyDocuments)
      .where(
        and(
          eq(propertyDocuments.id, id),
          eq(propertyDocuments.isDeleted, false),
        ),
      )
      .limit(1)
    const existing = rows[0]
    if (!existing) {
      return err("NOT_FOUND", "That document no longer exists.")
    }

    await tx
      .update(propertyDocuments)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(propertyDocuments.id, id))

    await deleteObject(existing.fileKey).catch(() => undefined)

    await writeAudit({
      ctx,
      entityType: "property_document",
      entityId: id,
      action: "delete",
      oldValue: {
        propertyId: existing.propertyId,
        title: existing.title,
        fileKey: existing.fileKey,
      },
    })

    return ok({ id })
  })
}
