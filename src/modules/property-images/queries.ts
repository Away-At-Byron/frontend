import "server-only"

import { and, asc, eq } from "drizzle-orm"
import { properties, propertyImages } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { presignDownload } from "@/lib/storage"
import { ok, err, type ActionResult } from "@/lib/result"
import type { PropertyImageRole, PropertyImageRow } from "./types"

async function assertVisible(
  tx: Parameters<Parameters<typeof withTenant>[0]>[0],
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
 * Return every active image attached to a property, ordered by role then
 * sort_order then upload time. Includes a short-lived presigned GET URL so
 * the caller can render the asset without a follow-up round-trip.
 */
export async function listPropertyImages(
  propertyId: string,
): Promise<ActionResult<PropertyImageRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.propertyId && ctx.propertyId !== propertyId) {
      return err("FORBIDDEN", "You can't view that property.")
    }
    const exists = await assertVisible(tx, propertyId)
    if (!exists.ok) return exists

    const rows = await tx
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
        role: propertyImages.role,
        fileKey: propertyImages.fileKey,
        mimeType: propertyImages.mimeType,
        sizeBytes: propertyImages.sizeBytes,
        widthPx: propertyImages.widthPx,
        heightPx: propertyImages.heightPx,
        caption: propertyImages.caption,
        sortOrder: propertyImages.sortOrder,
        uploadedAt: propertyImages.uploadedAt,
      })
      .from(propertyImages)
      .where(
        and(
          eq(propertyImages.propertyId, propertyId),
          eq(propertyImages.isDeleted, false),
        ),
      )
      .orderBy(
        asc(propertyImages.role),
        asc(propertyImages.sortOrder),
        asc(propertyImages.uploadedAt),
      )

    const withUrls: PropertyImageRow[] = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        propertyId: r.propertyId,
        role: r.role as PropertyImageRole,
        fileKey: r.fileKey,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        widthPx: r.widthPx,
        heightPx: r.heightPx,
        caption: r.caption,
        sortOrder: r.sortOrder,
        uploadedAt: r.uploadedAt.toISOString(),
        downloadUrl: await presignDownload(r.fileKey),
      })),
    )
    return ok(withUrls)
  })
}
