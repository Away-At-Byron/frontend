import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core"
import { users } from "./auth"
import { contacts } from "./contacts"
import { messages } from "./communications"
import { contactEmails } from "./contact-emails"

/**
 * Document categories. Open list — extend the enum when a new category is
 * needed. Stored as a Postgres enum so bad values fail at the DB.
 *
 * Subtype (e.g. "passport" for id_photo, "payment_receipt" for
 * booking_documents) is encoded in the `description` column. Promote to a
 * dedicated column if filtering by subtype becomes a real query.
 */
export const contactDocumentTypeEnum = pgEnum("contact_document_type", [
  "id_photo",
  "booking_documents",
  "other_documents",
  "communication",
])

/**
 * Files and notes attached to a contact (FRS module 4). Global, not tenanted
 * (ADR-006): contacts are global, so their documents are too. File bytes live
 * in MinIO under `fileKey`; the row is the metadata + audit trail.
 */
export const contactDocuments = pgTable(
  "contact_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: contactDocumentTypeEnum("type").notNull(),
    /** Human-readable label shown in the documents list. */
    title: text("title").notNull(),
    /** Free-text notes — e.g. context on a communication record. */
    description: text("description"),
    /** MinIO object key. Null when the row is a note-only entry. */
    fileKey: text("file_key"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    /**
     * Attachment link for `type='communication'` rows. The server action that
     * creates the message and its attachments writes both in one transaction;
     * non-comms rows leave this null.
     */
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "cascade",
    }),
    /**
     * Attachment link for `type='communication'` rows attached to an outbound
     * email. Mirrors `message_id` for in-portal chat. Exactly one of
     * (messageId, emailId) is populated on comms attachments.
     */
    emailId: uuid("email_id").references(() => contactEmails.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    index("contact_documents_contact_id_idx").on(t.contactId),
    index("contact_documents_message_id_idx").on(t.messageId),
    index("contact_documents_email_id_idx").on(t.emailId),
  ],
)

export type ContactDocument = typeof contactDocuments.$inferSelect
export type NewContactDocument = typeof contactDocuments.$inferInsert
