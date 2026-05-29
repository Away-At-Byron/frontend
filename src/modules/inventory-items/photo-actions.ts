"use server"

import { z } from "zod"
import {
  MAX_FILE_BYTES,
  buildInventoryItemPhotoKey,
  deleteObject,
  headObjectInfo,
  isAllowedMimeType,
  presignDownload,
  presignUpload,
  type PresignedUpload,
} from "@/lib/storage"
import { withTenant, type TenantContext } from "@/lib/rls"
import { ok, err, type ActionErr, type ActionResult } from "@/lib/result"

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage inventory photos.")
  }
  return null
}

const presignSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z
    .string()
    .refine((m) => isAllowedMimeType(m), {
      message: "Unsupported file type",
    }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_BYTES, `Max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB`),
})

/** Issue a presigned PUT URL for an inventory photo. */
export async function presignInventoryPhotoUpload(input: {
  fileName: string
  mimeType: string
  sizeBytes: number
}): Promise<ActionResult<PresignedUpload>> {
  return withTenant(async (_tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = presignSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const key = buildInventoryItemPhotoKey(parsed.data.fileName)
    const signed = await presignUpload({
      key,
      contentType: parsed.data.mimeType,
      contentLength: parsed.data.sizeBytes,
    })
    return ok(signed)
  })
}

/** Verify the byte upload completed and return a short-lived view URL. */
export async function commitInventoryPhotoUpload(input: {
  key: string
  sizeBytes: number
}): Promise<ActionResult<{ key: string; downloadUrl: string }>> {
  return withTenant(async (_tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    if (!input.key.startsWith("inventory/")) {
      return err("VALIDATION", "Upload key doesn't belong to inventory.")
    }
    const head = await headObjectInfo(input.key)
    if (!head.exists) {
      return err("VALIDATION", "Upload didn't complete. Try again.")
    }
    if (head.contentLength !== null && head.contentLength !== input.sizeBytes) {
      return err("VALIDATION", "Uploaded file size mismatch.")
    }
    if (head.contentLength !== null && head.contentLength > MAX_FILE_BYTES) {
      return err("VALIDATION", "File is over the size limit.")
    }
    const downloadUrl = await presignDownload(input.key)
    return ok({ key: input.key, downloadUrl })
  })
}

/** Short-lived view URL for an existing key. */
export async function getInventoryPhotoUrl(
  key: string,
): Promise<ActionResult<string>> {
  return withTenant(async (_tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate
    if (!key.startsWith("inventory/")) {
      return err("VALIDATION", "Key doesn't belong to inventory.")
    }
    const url = await presignDownload(key)
    return ok(url)
  })
}

/** Best-effort delete; missing object is not an error. */
export async function deleteInventoryPhotoObject(
  key: string,
): Promise<ActionResult<{ key: string }>> {
  return withTenant(async (_tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate
    await deleteObject(key).catch(() => undefined)
    return ok({ key })
  })
}

