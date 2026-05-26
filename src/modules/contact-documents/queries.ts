import "server-only"

import { and, desc, eq, sql } from "drizzle-orm"
import { contactDocuments, contacts, users } from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import { presignDownload } from "@/lib/storage"
import { CONTACT_DOCUMENT_PERMISSIONS } from "./permissions"
import type { ContactDocumentRow, ContactDocumentType } from "./types"

const documentSelection = {
  id: contactDocuments.id,
  contactId: contactDocuments.contactId,
  type: contactDocuments.type,
  title: contactDocuments.title,
  description: contactDocuments.description,
  fileKey: contactDocuments.fileKey,
  fileName: contactDocuments.fileName,
  mimeType: contactDocuments.mimeType,
  sizeBytes: contactDocuments.sizeBytes,
  uploadedBy: contactDocuments.uploadedBy,
  uploadedByName: sql<string | null>`${users.firstName} || ' ' || ${users.lastName}`,
  createdAt: contactDocuments.createdAt,
  updatedAt: contactDocuments.updatedAt,
} as const

function mapDocumentRow(r: {
  id: string
  contactId: string
  type: ContactDocumentType
  title: string
  description: string | null
  fileKey: string | null
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  uploadedBy: string | null
  uploadedByName: string | null
  createdAt: Date
  updatedAt: Date
}): ContactDocumentRow {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function listContactDocuments(
  contactId: string,
): Promise<ActionResult<ContactDocumentRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.read, ctx, async () => {
      const contactExists = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
        .limit(1)
      if (!contactExists[0]) return err("NOT_FOUND", "That contact no longer exists.")

      const rows = await tx
        .select(documentSelection)
        .from(contactDocuments)
        .leftJoin(users, eq(contactDocuments.uploadedBy, users.id))
        .where(
          and(
            eq(contactDocuments.contactId, contactId),
            eq(contactDocuments.isDeleted, false),
          ),
        )
        .orderBy(desc(contactDocuments.createdAt))

      return ok(rows.map(mapDocumentRow))
    }),
  )
}

export async function getContactDocument(
  id: string,
): Promise<ActionResult<ContactDocumentRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(CONTACT_DOCUMENT_PERMISSIONS.read, ctx, async () => {
      const rows = await tx
        .select(documentSelection)
        .from(contactDocuments)
        .leftJoin(users, eq(contactDocuments.uploadedBy, users.id))
        .where(
          and(eq(contactDocuments.id, id), eq(contactDocuments.isDeleted, false)),
        )
        .limit(1)
      const r = rows[0]
      if (!r) return err("NOT_FOUND", "That document no longer exists.")
      return ok(mapDocumentRow(r))
    }),
  )
}

/**
 * Returns a short-lived presigned GET URL. Regenerate on every click — never
 * persist or share these. The URL itself is the bearer credential.
 */
export async function getContactDocumentDownloadUrl(
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
