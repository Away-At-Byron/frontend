import "server-only"

import { and, asc, eq, sql } from "drizzle-orm"
import {
  contactDocuments,
  contacts,
  conversations,
  messages,
  users,
} from "@/db/schema"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import { presignDownload } from "@/lib/storage"
import { MESSAGE_PERMISSIONS } from "./permissions"
import type {
  ConversationRow,
  MessageAttachment,
  MessageRow,
  MessageSenderType,
} from "./types"

function mapConversation(row: {
  id: string
  contactId: string
  lastMessageAt: Date | null
  lastMessageSenderType: MessageSenderType | null
  createdAt: Date
  updatedAt: Date
}): ConversationRow {
  return {
    id: row.id,
    contactId: row.contactId,
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    lastMessageSenderType: row.lastMessageSenderType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // Staff inbox badge: unread when the latest message came from the contact
    // and no staff has replied since (the reply would flip the field to
    // 'user'). Cheap O(1) lookup, no message scan.
    unreadForStaff: row.lastMessageSenderType === "contact",
  }
}

/**
 * Returns the contact's conversation row. The caller can use it for the unread
 * badge before opening the thread; messages are fetched separately. Returns
 * null if no thread exists yet (no messages have been sent) — the first
 * sendMessage call lazily creates one.
 */
export async function getConversationByContact(
  contactId: string,
): Promise<ActionResult<ConversationRow | null>> {
  return withTenant(async (tx, ctx) =>
    withPermission(MESSAGE_PERMISSIONS.read, ctx, async () => {
      const exists = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
        .limit(1)
      if (!exists[0]) return err("NOT_FOUND", "That contact no longer exists.")

      const rows = await tx
        .select()
        .from(conversations)
        .where(eq(conversations.contactId, contactId))
        .limit(1)
      const r = rows[0]
      return ok(r ? mapConversation(r) : null)
    }),
  )
}

/**
 * Returns the messages in a conversation, oldest first (chat-bubble order).
 * Each message includes its attachments inlined; image attachments get
 * eager-signed preview URLs for cheap thumbnail rendering.
 */
export async function listMessages(
  conversationId: string,
): Promise<ActionResult<MessageRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(MESSAGE_PERMISSIONS.read, ctx, async () => {
      const msgRows = await tx
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderType: messages.senderType,
          senderUserId: messages.senderUserId,
          senderContactId: messages.senderContactId,
          userFirst: users.firstName,
          userLast: users.lastName,
          contactFirst: contacts.firstName,
          contactLast: contacts.lastName,
          body: messages.body,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderUserId, users.id))
        .leftJoin(contacts, eq(messages.senderContactId, contacts.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt))

      if (msgRows.length === 0) return ok([])

      const messageIds = msgRows.map((m) => m.id)
      const attRows = await tx
        .select({
          id: contactDocuments.id,
          messageId: contactDocuments.messageId,
          fileKey: contactDocuments.fileKey,
          fileName: contactDocuments.fileName,
          mimeType: contactDocuments.mimeType,
          sizeBytes: contactDocuments.sizeBytes,
        })
        .from(contactDocuments)
        .where(
          and(
            sql`${contactDocuments.messageId} IN ${messageIds}`,
            eq(contactDocuments.isDeleted, false),
          ),
        )

      const attachmentsByMessage = new Map<string, MessageAttachment[]>()
      for (const a of attRows) {
        const previewUrl =
          a.fileKey && a.mimeType?.startsWith("image/")
            ? await presignDownload(a.fileKey)
            : null
        const att: MessageAttachment = {
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          previewUrl,
        }
        const list = attachmentsByMessage.get(a.messageId!) ?? []
        list.push(att)
        attachmentsByMessage.set(a.messageId!, list)
      }

      return ok(
        msgRows.map((m): MessageRow => {
          const senderName =
            m.senderType === "user"
              ? m.userFirst && m.userLast
                ? `${m.userFirst} ${m.userLast}`
                : null
              : m.contactFirst && m.contactLast
                ? `${m.contactFirst} ${m.contactLast}`
                : null
          return {
            id: m.id,
            conversationId: m.conversationId,
            senderType: m.senderType,
            senderUserId: m.senderUserId,
            senderContactId: m.senderContactId,
            senderName,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
            attachments: attachmentsByMessage.get(m.id) ?? [],
          }
        }),
      )
    }),
  )
}
