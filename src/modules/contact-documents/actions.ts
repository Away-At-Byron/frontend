"use server"

import { and, eq, inArray } from "drizzle-orm"
import { contactDocuments, contacts } from "@/db/schema"
import { auth } from "@/lib/auth"
import { withTenant, withPermission } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult } from "@/lib/result"
import { z } from "zod"
import {
  buildContactDocumentKey,
  deleteObject,
  headObjectInfo,
  MAX_FILE_BYTES,
  presignDownload,
  presignUpload,
  type PresignedUpload,
} from "@/lib/storage"
import {
  confirmUploadsSchema,
  presignUploadsSchema,
  updateContactDocumentSchema,
  type ConfirmUploadsInput,
  type PresignUploadsInput,
  type UpdateContactDocumentInput,
} from "./schemas"
import { CONTACT_DOCUMENT_PERMISSIONS } from "./permissions"
import type { ContactDocumentRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

async function assertContactExists(
  tx: Tx,
  contactId: string,
): Promise<ActionResult<true>> {
  const rows = await tx
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
    .limit(1)
  if (!rows[0]) return err("NOT_FOUND", "That contact no longer exists.")
  return ok(true)
}

export type PresignedUploadForFile = PresignedUpload & {
  fileName: string
  mimeType: string
  sizeBytes: number
}

/**
 * Shared body — caller has already established who the contact id belongs to.
 * Both `presignContactDocumentUploads` (staff, contactId from input) and
 * `presignContactDocumentUploadsAsContact` (contact, contactId from session)
 * end up here.
 */
async function presignBatch(
  contactId: string,
  files: { fileName: string; mimeType: string; sizeBytes: number }[],
): Promise<PresignedUploadForFile[]> {
  return Promise.all(
    files.map(async (f) => {
      const key = buildContactDocumentKey(contactId, f.fileName)
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
}

/**
 * Step 1 of the upload flow. Returns one presigned PUT URL per requested file
 * so the client can upload bytes directly to MinIO in parallel — keeping large
 * payloads off the Next server (CLAUDE.md serverActions.bodySizeLimit = 2 MB).
 */
export async function presignContactDocumentUploads(
  input: PresignUploadsInput,
): Promise<ActionResult<PresignedUploadForFile[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.upload, ctx, async () => {
      const parsed = presignUploadsSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const { contactId, files } = parsed.data

      const contactCheck = await assertContactExists(tx, contactId)
      if (!contactCheck.ok) return contactCheck

      return ok(await presignBatch(contactId, files))
    }),
  )
}

/**
 * Contact-portal counterpart. The contact id is derived from the signed-in
 * session — a contact cannot presign uploads under another contact's prefix.
 * Used by the portal Messages composer when attaching files to a reply.
 */
const presignFilesOnlySchema = z.object({
  files: presignUploadsSchema.shape.files,
})

export async function presignContactDocumentUploadsAsContact(input: {
  files: PresignUploadsInput["files"]
}): Promise<ActionResult<PresignedUploadForFile[]>> {
  const session = await auth()
  if (!session?.user?.id || session.user.subjectType !== "contact") {
    return err("UNAUTHENTICATED", "You are not signed in.")
  }
  const contactId = session.user.id

  const parsed = presignFilesOnlySchema.safeParse(input)
  if (!parsed.success) {
    return err(
      "VALIDATION",
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    )
  }

  return ok(await presignBatch(contactId, parsed.data.files))
}

/**
 * Step 2 of the upload flow. After the client PUTs each blob to its presigned
 * URL, this writes one row per file in a single transaction. We HEAD each
 * object first to confirm the upload actually landed AND to catch a client
 * that uploaded a different size than it claimed at presign time.
 *
 * Partial failures roll back the whole transaction — orphan objects in MinIO
 * get reaped by a lifecycle rule, not us.
 */
export async function confirmContactDocumentUploads(
  input: ConfirmUploadsInput,
): Promise<ActionResult<ContactDocumentRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.upload, ctx, async () => {
      const parsed = confirmUploadsSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const { contactId, items } = parsed.data

      const contactCheck = await assertContactExists(tx, contactId)
      if (!contactCheck.ok) return contactCheck

      // Each key must live under the contact's prefix — stops a client from
      // confirming a key it never had presign permission for.
      const expectedPrefix = `contacts/${contactId}/`
      for (const item of items) {
        if (!item.key.startsWith(expectedPrefix)) {
          return err("VALIDATION", "One or more files don't belong to this contact.")
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
        .insert(contactDocuments)
        .values(
          items.map((i) => ({
            contactId,
            type: i.type,
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
          entityType: "contact_document",
          entityId: row.id,
          action: "create",
          newValue: {
            contactId,
            title: row.title,
            fileName: row.fileName,
            sizeBytes: row.sizeBytes,
          },
        })
      }

      return ok(
        inserted.map((r) => ({
          id: r.id,
          contactId: r.contactId,
          type: r.type,
          title: r.title,
          description: r.description,
          fileKey: r.fileKey,
          fileName: r.fileName,
          mimeType: r.mimeType,
          sizeBytes: r.sizeBytes,
          uploadedBy: r.uploadedBy,
          // We don't join users here; the list query repopulates this on read.
          uploadedByName: null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      )
    }),
  )
}

export async function updateContactDocument(
  id: string,
  input: UpdateContactDocumentInput,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.update, ctx, async () => {
      const parsed = updateContactDocumentSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      const existing = await tx
        .select({ id: contactDocuments.id, title: contactDocuments.title })
        .from(contactDocuments)
        .where(
          and(eq(contactDocuments.id, id), eq(contactDocuments.isDeleted, false)),
        )
        .limit(1)
      if (!existing[0]) return err("NOT_FOUND", "That document no longer exists.")

      await tx
        .update(contactDocuments)
        .set({
          type: data.type,
          title: data.title,
          description: data.description ?? null,
          updatedAt: new Date(),
        })
        .where(eq(contactDocuments.id, id))

      await writeAudit({
        ctx,
        entityType: "contact_document",
        entityId: id,
        action: "update",
        oldValue: { title: existing[0].title },
        newValue: { title: data.title, type: data.type },
      })

      return ok({ id })
    }),
  )
}

/**
 * Soft delete. Bytes stay in MinIO until a separate sweeper job reaps them —
 * lets ops recover a row that was deleted by mistake. Use deleteContactDocumentHard
 * if you genuinely need to purge the blob (e.g. GDPR erasure request).
 */
export async function deleteContactDocument(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.delete, ctx, async () => {
      const existing = await tx
        .select({
          id: contactDocuments.id,
          title: contactDocuments.title,
          fileName: contactDocuments.fileName,
        })
        .from(contactDocuments)
        .where(
          and(eq(contactDocuments.id, id), eq(contactDocuments.isDeleted, false)),
        )
        .limit(1)
      if (!existing[0]) return err("NOT_FOUND", "That document no longer exists.")

      await tx
        .update(contactDocuments)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(contactDocuments.id, id))

      await writeAudit({
        ctx,
        entityType: "contact_document",
        entityId: id,
        action: "delete",
        oldValue: { title: existing[0].title, fileName: existing[0].fileName },
      })

      return ok({ id })
    }),
  )
}

/**
 * Hard delete — drops the row AND the MinIO object. For privacy requests where
 * the byte itself must be gone, not just hidden from the UI. Audit is written
 * before the row goes so the trail survives.
 */
/**
 * Issues a short-lived presigned GET URL for the row. Server-action wrapper
 * around the read-side query so client components (which can't import
 * `server-only` modules) can refresh image previews when a URL expires.
 */
export async function getContactDocumentDownloadUrlAction(
  id: string,
): Promise<ActionResult<{ url: string; fileName: string | null }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select({
          fileKey: contactDocuments.fileKey,
          fileName: contactDocuments.fileName,
        })
        .from(contactDocuments)
        .where(
          and(eq(contactDocuments.id, id), eq(contactDocuments.isDeleted, false)),
        )
        .limit(1)
      const r = rows[0]
      if (!r) return err("NOT_FOUND", "That document no longer exists.")
      if (!r.fileKey) return err("NOT_FOUND", "This entry has no file attached.")
      const url = await presignDownload(r.fileKey)
      return ok({ url, fileName: r.fileName })
    }),
  )
}

export async function deleteContactDocumentHard(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.delete, ctx, async () => {
      const existing = await tx
        .select({
          id: contactDocuments.id,
          title: contactDocuments.title,
          fileName: contactDocuments.fileName,
          fileKey: contactDocuments.fileKey,
        })
        .from(contactDocuments)
        .where(eq(contactDocuments.id, id))
        .limit(1)
      if (!existing[0]) return err("NOT_FOUND", "That document no longer exists.")

      await writeAudit({
        ctx,
        entityType: "contact_document",
        entityId: id,
        action: "delete",
        oldValue: {
          title: existing[0].title,
          fileName: existing[0].fileName,
          hard: true,
        },
      })

      await tx
        .delete(contactDocuments)
        .where(inArray(contactDocuments.id, [id]))

      if (existing[0].fileKey) {
        try {
          await deleteObject(existing[0].fileKey)
        } catch {
          // Best-effort — the DB row is gone, an orphan blob is a lifecycle
          // problem, not a user-facing error.
        }
      }

      return ok({ id })
    }),
  )
}
