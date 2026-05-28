import {
  pgTable,
  uuid,
  text,
  char,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { propertyAmenities } from "./property-amenities"

export const propertyStatus = pgEnum("property_status", ["active", "inactive"])

/**
 * Layer 0. A Property is one guesthouse and the multi-tenant boundary.
 * No RLS on this table itself — it IS the boundary. Admin reads all;
 * staff are scoped via the app-layer check + `app.property_id` GUC.
 *
 * Owner email/phone are read live from contacts via owner{1,2}_contact_id.
 * Manager's on_call_number / property_email autoprefill from the user
 * record once on selection, but are stored and editable per property.
 *
 * `property_manager_user_id`, `owner1_contact_id`, `owner2_contact_id` are
 * declared without `references(...)` here to avoid a circular import with
 * users/contacts; the FK is added by the migration.
 */
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  addressStreet: text("address_street"),
  addressSuburb: text("address_suburb"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressPostcode: text("address_postcode"),
  addressCountry: char("address_country", { length: 2 }).default("AU"),
  numberOfRooms: integer("number_of_rooms").default(0),
  propertyColour: text("property_colour"), // hex, calendar bands
  status: propertyStatus("status").default("active").notNull(),
  timezone: text("timezone").notNull().default("Australia/Sydney"),
  currency: char("currency", { length: 3 }).notNull().default("AUD"),
  taxNumber: text("tax_number"), // ABN
  website: text("website"),
  gstRateBp: integer("gst_rate_bp").notNull().default(1000), // basis points = 10%

  // ── Operations (Edit Property → Operations panel) ──────────
  propertyManagerUserId: uuid("property_manager_user_id"),
  onCallNumber: text("on_call_number"),
  propertyEmail: text("property_email"),
  lockboxAccess: text("lockbox_access"),
  wifiNetwork: text("wifi_network"),

  // ── Property owners (read email/phone live from contacts) ──
  owner1ContactId: uuid("owner1_contact_id"),
  owner2ContactId: uuid("owner2_contact_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Property = typeof properties.$inferSelect
export type NewProperty = typeof properties.$inferInsert

/**
 * Many-to-many: which amenities the property exposes. Both sides cascade
 * deliberately (delete the property OR the amenity removes the link).
 */
export const propertyAmenityAssignments = pgTable(
  "property_amenity_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull(),
    propertyAmenityId: uuid("property_amenity_id")
      .notNull()
      .references(() => propertyAmenities.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("property_amenity_assignments_pair_uq").on(
      t.propertyId,
      t.propertyAmenityId,
    ),
    index("property_amenity_assignments_property_idx").on(t.propertyId),
  ],
)

export type PropertyAmenityAssignment =
  typeof propertyAmenityAssignments.$inferSelect
export type NewPropertyAmenityAssignment =
  typeof propertyAmenityAssignments.$inferInsert
