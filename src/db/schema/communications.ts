import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { contacts } from "./contacts"

/**
 * Who sent a given message. Drives the contact-portal vs staff-inbox UX and
 * the cheap unread heuristic on `conversations.last_message_sender_type`.
 */
export const messageSenderTypeEnum = pgEnum("message_sender_type", [
  "user",
  "contact",
])

/**
 * In-portal conversation between staff and a single contact (FRS §6.24,
 * extended per session decision: in-portal chat, not just outbound log).
 * One thread per contact — multiple staff can post in the same thread.
 * Global, not tenanted (ADR-006: contacts are global, conversations follow).
 *
 * `last_message_at` + `last_message_sender_type` are denormalised from the
 * latest message so the staff inbox can sort + show "unread" without joining
 * `messages` on every render. Unread for staff = sender_type 'contact';
 * unread for the contact = sender_type 'user'.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessageSenderType: messageSenderTypeEnum("last_message_sender_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One thread per contact — the unique constraint is the contract that
    // getOrCreateConversation relies on.
    uniqueIndex("conversations_contact_id_uq").on(t.contactId),
    index("conversations_last_message_at_idx").on(t.lastMessageAt),
  ],
)

/**
 * Append-only. No soft-delete column on purpose: messages are part of the
 * audit trail (CLAUDE.md §10). If staff sends something wrong, they send a
 * correction.
 *
 * Exactly one of `sender_user_id` / `sender_contact_id` is populated, matching
 * `sender_type`. The CHECK constraint enforces this at the DB so a buggy
 * action can't leave the row in an ambiguous state.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: messageSenderTypeEnum("sender_type").notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    senderContactId: uuid("sender_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_id_created_at_idx").on(
      t.conversationId,
      t.createdAt,
    ),
    check(
      "messages_sender_xor_chk",
      sql`(
        (sender_type = 'user'    AND sender_user_id    IS NOT NULL AND sender_contact_id IS NULL)
        OR
        (sender_type = 'contact' AND sender_contact_id IS NOT NULL AND sender_user_id    IS NULL)
      )`,
    ),
  ],
)

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
