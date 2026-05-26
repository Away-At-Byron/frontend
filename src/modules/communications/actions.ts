"use server"

import { and, eq } from "drizzle-orm"
import { contactDocuments, contacts, conversations, messages, auditLog } from "@/db/schema"
import { db } from "@/db"
import { auth } from "@/lib/auth"
import { withTenant, withPermission } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult } from "@/lib/result"
import { headObjectInfo, MAX_FILE_BYTES } from "@/lib/storage"
import {
  sendMessageSchema,
  sendMessageAsContactSchema,
  type SendMessageAsContactInput,
  type SendMessageInput,
} from "./schemas"
import { MESSAGE_PERMISSIONS } from "./permissions"
import type { MessageRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

/**
 * Idempotently returns the contact's conversation, creating it on first call.
 * Race-safe because of the UNIQUE constraint on `conversations.contact_id`:
 * two concurrent inserts collide, the second is caught and converted to a
 * select. Internal — call from inside a transaction.
 */
async function getOrCreateConversation(
  tx: Tx,
  contactId: string,
): Promise<{ id: string }> {
  const existing = await tx
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.contactId, contactId))
    .limit(1)
  if (existing[0]) return existing[0]

  try {
    const inserted = await tx
      .insert(conversations)
      .values({ contactId })
      .returning({ id: conversations.id })
    return inserted[0]!
  } catch (e) {
    // 23505 = unique_violation — a parallel call beat us; re-read and return.
    if (
      typeof e === "object" &&
      e !== null &&
      (e as { code?: string }).code === "23505"
    ) {
      const r = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.contactId, contactId))
        .limit(1)
      if (r[0]) return r[0]
    }
    throw e
  }
}

/**
 * Staff sends a message in a contact's thread. Lazily creates the conversation
 * on first send. Optional attachments must already have been PUT to MinIO via
 * the presign flow; we HEAD each key here to confirm the upload completed and
 * size matches before writing the `contact_documents` row.
 *
 * Whole flow is one transaction — partial failure rolls back the message AND
 * any attachment rows (orphan MinIO blobs get reaped by the bucket lifecycle).
 */
export async function sendMessage(
  input: SendMessageInput,
): Promise<ActionResult<MessageRow>> {
  return withTenant(async (tx, ctx) =>
    withPermission(MESSAGE_PERMISSIONS.send, ctx, async () => {
      const parsed = sendMessageSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          "VALIDATION",
          "Check the highlighted fields.",
          parsed.error.flatten().fieldErrors,
        )
      }
      const data = parsed.data

      // Defence in depth — RLS doesn't apply (global table), so confirm the
      // contact actually exists and isn't soft-deleted before opening a thread.
      const exists = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, data.contactId), eq(contacts.isDeleted, false)))
        .limit(1)
      if (!exists[0]) return err("NOT_FOUND", "That contact no longer exists.")

      // Belt-and-braces: every attachment key must live under the contact's
      // prefix. Stops a caller from confirming a key they never had presign
      // permission for (the prefix is also what presignContactDocumentUploads
      // produces, so this can never reject a legitimate flow).
      const attachments = data.attachments ?? []
      const expectedPrefix = `contacts/${data.contactId}/`
      for (const a of attachments) {
        if (!a.key.startsWith(expectedPrefix)) {
          return err("VALIDATION", "One or more attachments don't belong to this contact.")
        }
      }

      if (attachments.length > 0) {
        const heads = await Promise.all(attachments.map((a) => headObjectInfo(a.key)))
        for (let i = 0; i < attachments.length; i++) {
          const head = heads[i]!
          const a = attachments[i]!
          if (!head.exists) {
            return err(
              "VALIDATION",
              `Upload for "${a.fileName}" didn't complete. Try again.`,
            )
          }
          if (head.contentLength !== null && head.contentLength !== a.sizeBytes) {
            return err(
              "VALIDATION",
              `"${a.fileName}" is a different size than expected.`,
            )
          }
          if (head.contentLength !== null && head.contentLength > MAX_FILE_BYTES) {
            return err("VALIDATION", `"${a.fileName}" is over the size limit.`)
          }
        }
      }

      const conv = await getOrCreateConversation(tx, data.contactId)

      const now = new Date()
      const inserted = await tx
        .insert(messages)
        .values({
          conversationId: conv.id,
          senderType: "user",
          senderUserId: ctx.userId,
          body: data.body,
          createdAt: now,
        })
        .returning()
      const msg = inserted[0]!

      if (attachments.length > 0) {
        await tx.insert(contactDocuments).values(
          attachments.map((a) => ({
            contactId: data.contactId,
            type: "communication" as const,
            title: a.fileName,
            // The textual message itself carries the context; description stays
            // null on comms attachments unless the UI grows a caption input.
            description: null,
            fileKey: a.key,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            uploadedBy: ctx.userId,
            messageId: msg.id,
          })),
        )
      }

      // Denormalised pointer used by the staff inbox sort + unread badge.
      await tx
        .update(conversations)
        .set({
          lastMessageAt: now,
          lastMessageSenderType: "user",
          updatedAt: now,
        })
        .where(eq(conversations.id, conv.id))

      await writeAudit({
        ctx,
        entityType: "message",
        entityId: msg.id,
        action: "create",
        newValue: {
          contactId: data.contactId,
          conversationId: conv.id,
          attachmentCount: attachments.length,
        },
      })

      // Caller usually re-fetches the thread; return the bare row so a
      // fast-path UI can append it without a round trip.
      return ok({
        id: msg.id,
        conversationId: msg.conversationId,
        senderType: "user",
        senderUserId: msg.senderUserId,
        senderContactId: null,
        senderName: null,
        body: msg.body,
        createdAt: msg.createdAt.toISOString(),
        attachments: [],
      })
    }),
  )
}

/**
 * Contact replies in their own thread (called from the `/portal/messages`
 * page). The contact id is derived from the signed-in session, never from
 * input — so a contact can't address someone else's thread.
 *
 * No permission map check: the auth gate (`subjectType === 'contact'`) plus
 * the session-derived contactId is the whole security boundary. The contact
 * role isn't in lib/permissions.ts on purpose.
 */
export async function sendMessageAsContact(
  input: SendMessageAsContactInput,
): Promise<ActionResult<MessageRow>> {
  const session = await auth()
  if (
    !session?.user?.id ||
    session.user.subjectType !== "contact"
  ) {
    return err("UNAUTHENTICATED", "You are not signed in.")
  }
  const contactId = session.user.id

  const parsed = sendMessageAsContactSchema.safeParse(input)
  if (!parsed.success) {
    return err(
      "VALIDATION",
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    )
  }
  const data = parsed.data

  return db.transaction(async (tx) => {
    const exists = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
      .limit(1)
    if (!exists[0]) {
      return err("NOT_FOUND", "Your contact record no longer exists.")
    }

    const attachments = data.attachments ?? []
    const expectedPrefix = `contacts/${contactId}/`
    for (const a of attachments) {
      if (!a.key.startsWith(expectedPrefix)) {
        return err("VALIDATION", "One or more attachments don't belong to you.")
      }
    }

    if (attachments.length > 0) {
      const heads = await Promise.all(attachments.map((a) => headObjectInfo(a.key)))
      for (let i = 0; i < attachments.length; i++) {
        const head = heads[i]!
        const a = attachments[i]!
        if (!head.exists) {
          return err(
            "VALIDATION",
            `Upload for "${a.fileName}" didn't complete. Try again.`,
          )
        }
        if (head.contentLength !== null && head.contentLength !== a.sizeBytes) {
          return err(
            "VALIDATION",
            `"${a.fileName}" is a different size than expected.`,
          )
        }
        if (head.contentLength !== null && head.contentLength > MAX_FILE_BYTES) {
          return err("VALIDATION", `"${a.fileName}" is over the size limit.`)
        }
      }
    }

    const conv = await getOrCreateConversation(tx, contactId)

    const now = new Date()
    const inserted = await tx
      .insert(messages)
      .values({
        conversationId: conv.id,
        senderType: "contact",
        senderContactId: contactId,
        body: data.body,
        createdAt: now,
      })
      .returning()
    const msg = inserted[0]!

    if (attachments.length > 0) {
      await tx.insert(contactDocuments).values(
        attachments.map((a) => ({
          contactId,
          type: "communication" as const,
          title: a.fileName,
          description: null,
          fileKey: a.key,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          // No uploadedBy — the contact isn't a staff user. The message_id +
          // sender_contact_id together identify who attached it.
          uploadedBy: null,
          messageId: msg.id,
        })),
      )
    }

    await tx
      .update(conversations)
      .set({
        lastMessageAt: now,
        lastMessageSenderType: "contact",
        updatedAt: now,
      })
      .where(eq(conversations.id, conv.id))

    // Audit row has nullable user_id (see audit.ts). Contact-side actions
    // leave user_id null and surface the actor as contactId in newValue.
    // Promote to a dedicated subject_type column if audit gets richer.
    await tx.insert(auditLog).values({
      userId: null,
      entityType: "message",
      entityId: msg.id,
      action: "create",
      newValue: {
        contactId,
        conversationId: conv.id,
        attachmentCount: attachments.length,
        actor: "contact",
      },
    })

    return ok({
      id: msg.id,
      conversationId: msg.conversationId,
      senderType: "contact" as const,
      senderUserId: null,
      senderContactId: msg.senderContactId,
      senderName: null,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      attachments: [],
    })
  })
}
