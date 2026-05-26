import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { contacts } from "./contacts"

/**
 * Delivery state for a contact email. v1 is outbound only; `queued` covers
 * the brief window between row insert and the transport returning. Reply
 * threading (inbound) lands later; this table is futureproofed for it.
 */
export const contactEmailStatusEnum = pgEnum("contact_email_status", [
  "sent",
  "failed",
  "queued",
])

/**
 * Outbound marketing / one-off email sent from the staff Contact > Communication
 * tab. Append-only audit row — every Compose Email send writes one. Attachment
 * bytes live in MinIO via contact_documents (type='communication') joined by
 * `email_id`, mirroring the in-portal chat attachment pattern.
 *
 * Global, not tenanted — contacts are global (ADR-006), and their email log
 * follows. Multi-recipient cc/bcc are stored as text[] so a single send keeps
 * one row regardless of how many people were addressed.
 */
export const contactEmails = pgTable(
  "contact_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    fromAddress: text("from_address").notNull(),
    toAddresses: text("to_addresses")
      .array()
      .notNull(),
    ccAddresses: text("cc_addresses")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    bccAddresses: text("bcc_addresses")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    subject: text("subject").notNull(),
    bodyText: text("body_text").notNull(),
    bodyHtml: text("body_html"),
    status: contactEmailStatusEnum("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentByUserId: uuid("sent_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contact_emails_contact_id_created_at_idx").on(
      t.contactId,
      t.createdAt,
    ),
  ],
)

export type ContactEmail = typeof contactEmails.$inferSelect
export type NewContactEmail = typeof contactEmails.$inferInsert
