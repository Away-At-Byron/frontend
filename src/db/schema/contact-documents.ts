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

/**
 * Document categories. Open list — extend the enum when a new category is
 * needed. Stored as a Postgres enum so bad values fail at the DB.
 */
export const contactDocumentTypeEnum = pgEnum("contact_document_type", [
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [index("contact_documents_contact_id_idx").on(t.contactId)],
)

export type ContactDocument = typeof contactDocuments.$inferSelect
export type NewContactDocument = typeof contactDocuments.$inferInsert
