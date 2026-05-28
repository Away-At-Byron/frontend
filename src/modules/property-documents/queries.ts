import "server-only"

import { and, desc, eq } from "drizzle-orm"
import { properties, propertyDocuments, users } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { presignDownload } from "@/lib/storage"
import { ok, err, type ActionResult } from "@/lib/result"
import type { PropertyDocumentRow } from "./types"

/**
 * Active documents attached to a property, newest first. Each row includes a
 * short-lived signed GET URL so the table can wire the View / Download action
 * without a follow-up call.
 */
export async function listPropertyDocuments(
  propertyId: string,
): Promise<ActionResult<PropertyDocumentRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.propertyId && ctx.propertyId !== propertyId) {
      return err("FORBIDDEN", "You can't view that property.")
    }

    const propRows = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)
    if (!propRows[0]) return err("NOT_FOUND", "That property no longer exists.")

    const rows = await tx
      .select({
        id: propertyDocuments.id,
        propertyId: propertyDocuments.propertyId,
        title: propertyDocuments.title,
        description: propertyDocuments.description,
        fileKey: propertyDocuments.fileKey,
        fileName: propertyDocuments.fileName,
        mimeType: propertyDocuments.mimeType,
        sizeBytes: propertyDocuments.sizeBytes,
        uploadedBy: propertyDocuments.uploadedBy,
        uploadedAt: propertyDocuments.uploadedAt,
        updatedAt: propertyDocuments.updatedAt,
        uploadedByFirst: users.firstName,
        uploadedByLast: users.lastName,
      })
      .from(propertyDocuments)
      .leftJoin(users, eq(users.id, propertyDocuments.uploadedBy))
      .where(
        and(
          eq(propertyDocuments.propertyId, propertyId),
          eq(propertyDocuments.isDeleted, false),
        ),
      )
      .orderBy(desc(propertyDocuments.uploadedAt))

    const out: PropertyDocumentRow[] = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        propertyId: r.propertyId,
        title: r.title,
        description: r.description,
        fileKey: r.fileKey,
        fileName: r.fileName,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        uploadedBy: r.uploadedBy,
        uploadedByName:
          r.uploadedByFirst || r.uploadedByLast
            ? [r.uploadedByFirst, r.uploadedByLast].filter(Boolean).join(" ")
            : null,
        uploadedAt: r.uploadedAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        downloadUrl: await presignDownload(r.fileKey),
      })),
    )
    return ok(out)
  })
}
