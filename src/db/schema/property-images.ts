import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { properties } from "./properties"
import { users } from "./auth"

/**
 * `role` decides where the image renders on the property page:
 *   - logo    — square brand mark used in topbar, invoices, guest emails.
 *               At most one active per property.
 *   - hero    — wide header image at the top of the public listing.
 *               At most one active per property.
 *   - gallery — ordered grid of property photos.
 */
export const propertyImageRoleEnum = pgEnum("property_image_role", [
  "logo",
  "hero",
  "gallery",
])

/**
 * Images attached to a property (Edit Property → Images & attachments tab).
 * File bytes live in MinIO under `file_key`; the row is metadata + audit.
 * Tenanted via `property_id` so RLS scopes them with the rest of the
 * property's data when policies land.
 */
export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    role: propertyImageRoleEnum("role").notNull(),
    fileKey: text("file_key").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    widthPx: integer("width_px"),
    heightPx: integer("height_px"),
    /** Optional caption shown over gallery tiles (e.g. "Garden", "Lounge"). */
    caption: text("caption"),
    /** Order within `role` (0 = first). Gallery uses this for the grid. */
    sortOrder: smallint("sort_order").notNull().default(0),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    // One active logo and one active hero per property.
    uniqueIndex("property_images_one_logo_per_property")
      .on(t.propertyId)
      .where(sql`${t.role} = 'logo' AND ${t.isDeleted} = false`),
    uniqueIndex("property_images_one_hero_per_property")
      .on(t.propertyId)
      .where(sql`${t.role} = 'hero' AND ${t.isDeleted} = false`),
    // Most reads filter by property + role and order by sort_order.
    index("property_images_property_role_idx").on(
      t.propertyId,
      t.role,
      t.sortOrder,
    ),
  ],
)

export type PropertyImage = typeof propertyImages.$inferSelect
export type NewPropertyImage = typeof propertyImages.$inferInsert
