import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core"
import { properties } from "./properties"
import { users } from "./auth"

/**
 * Files attached to a property (Edit Property → Images & attachments tab,
 * Documents section). Brochures, surveys, contracts, insurance certificates,
 * floor plans. File bytes live in MinIO under `file_key`; the row is the
 * metadata + audit trail. Tenanted via `property_id`.
 *
 * Distinct from property_images so the document list query stays small and
 * indexes don't have to filter out images.
 */
export const propertyDocuments = pgTable(
  "property_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** Human-readable label shown in the documents list. */
    title: text("title").notNull(),
    description: text("description"),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    index("property_documents_property_id_idx").on(t.propertyId),
  ],
)

export type PropertyDocument = typeof propertyDocuments.$inferSelect
export type NewPropertyDocument = typeof propertyDocuments.$inferInsert
