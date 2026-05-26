import "server-only"

import { and, asc, desc, eq, sql } from "drizzle-orm"
import {
  contactDocuments,
  contactEmails,
  contacts,
  conversations,
  messages,
  users,
} from "@/db/schema"
import { db } from "@/db"
import { auth } from "@/lib/auth"
import { withTenant, withPermission } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import { presignDownload } from "@/lib/storage"
import { MESSAGE_PERMISSIONS } from "./permissions"
import type {
  ContactEmailRow,
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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Shared loader — joins sender names from users/contacts, eager-signs image
 * attachments, returns MessageRow[]. Used by both the staff and contact-side
 * queries so the join shape doesn't drift between them.
 */
async function loadMessages(
  tx: Tx,
  conversationId: string,
): Promise<MessageRow[]> {
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

  if (msgRows.length === 0) return []

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

  return msgRows.map((m): MessageRow => {
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
  })
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
      return ok(await loadMessages(tx, conversationId))
    }),
  )
}

/**
 * Contact-portal counterpart to getConversationByContact + listMessages.
 * Single round trip from `/portal/messages`. The contact id comes from the
 * signed-in session, never input — same security boundary as
 * `sendMessageAsContact`.
 */
/**
 * Outbound email log for the Contact > Communication tab. Newest first so the
 * list shows the most recent send at the top. Attachment count is joined off
 * `contact_documents.email_id`. Caller wraps with withTenant — contacts are
 * global but the comms read permission lives on the contact role.
 */
export async function listContactEmails(
  contactId: string,
): Promise<ActionResult<ContactEmailRow[]>> {
  return withTenant(async (tx, ctx) =>
    withPermission(MESSAGE_PERMISSIONS.read, ctx, async () => {
      const exists = await tx
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
        .limit(1)
      if (!exists[0]) return err("NOT_FOUND", "That contact no longer exists.")

      const rows = await tx
        .select({
          id: contactEmails.id,
          contactId: contactEmails.contactId,
          fromAddress: contactEmails.fromAddress,
          toAddresses: contactEmails.toAddresses,
          ccAddresses: contactEmails.ccAddresses,
          bccAddresses: contactEmails.bccAddresses,
          subject: contactEmails.subject,
          bodyText: contactEmails.bodyText,
          status: contactEmails.status,
          errorMessage: contactEmails.errorMessage,
          sentAt: contactEmails.sentAt,
          sentByUserId: contactEmails.sentByUserId,
          sentByFirst: users.firstName,
          sentByLast: users.lastName,
          createdAt: contactEmails.createdAt,
          attachmentCount: sql<number>`(
            SELECT COUNT(*)::int FROM ${contactDocuments}
            WHERE ${contactDocuments.emailId} = ${contactEmails.id}
              AND ${contactDocuments.isDeleted} = false
          )`,
        })
        .from(contactEmails)
        .leftJoin(users, eq(contactEmails.sentByUserId, users.id))
        .where(eq(contactEmails.contactId, contactId))
        .orderBy(desc(contactEmails.createdAt))

      return ok(
        rows.map((r): ContactEmailRow => ({
          id: r.id,
          contactId: r.contactId,
          fromAddress: r.fromAddress,
          toAddresses: r.toAddresses,
          ccAddresses: r.ccAddresses,
          bccAddresses: r.bccAddresses,
          subject: r.subject,
          bodyText: r.bodyText,
          status: r.status,
          errorMessage: r.errorMessage,
          sentAt: r.sentAt ? r.sentAt.toISOString() : null,
          sentByUserId: r.sentByUserId,
          sentByName:
            r.sentByFirst && r.sentByLast
              ? `${r.sentByFirst} ${r.sentByLast}`
              : null,
          createdAt: r.createdAt.toISOString(),
          attachmentCount: r.attachmentCount ?? 0,
        })),
      )
    }),
  )
}

export async function getMyConversationWithMessages(): Promise<
  ActionResult<{ conversation: ConversationRow | null; messages: MessageRow[] }>
> {
  const session = await auth()
  if (
    !session?.user?.id ||
    session.user.subjectType !== "contact"
  ) {
    return err("UNAUTHENTICATED", "You are not signed in.")
  }
  const contactId = session.user.id

  return db.transaction(async (tx) => {
    const exists = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.isDeleted, false)))
      .limit(1)
    if (!exists[0]) {
      return err("NOT_FOUND", "Your contact record no longer exists.")
    }

    const convRows = await tx
      .select()
      .from(conversations)
      .where(eq(conversations.contactId, contactId))
      .limit(1)
    const convRow = convRows[0] ?? null
    const conversation = convRow ? mapConversation(convRow) : null

    const msgs = conversation ? await loadMessages(tx, conversation.id) : []
    return ok({ conversation, messages: msgs })
  })
}
