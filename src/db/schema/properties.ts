import { pgTable, uuid, text, char, integer, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const propertyStatus = pgEnum("property_status", ["active", "inactive"])

/**
 * Layer 0. A Property is one guesthouse and the multi-tenant boundary.
 * No RLS on this table itself — it IS the boundary. Admin reads all;
 * staff are scoped via the app-layer check + `app.property_id` GUC.
 */
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  addressStreet: text("address_street"),
  addressSuburb: text("address_suburb"),
  addressCity: text("address_city"),
  addressPostcode: text("address_postcode"),
  addressCountry: char("address_country", { length: 2 }).default("AU"),
  numberOfRooms: integer("number_of_rooms").default(0),
  propertyColour: text("property_colour"), // hex, calendar bands
  status: propertyStatus("status").default("active").notNull(),
  timezone: text("timezone").notNull().default("Australia/Sydney"),
  currency: char("currency", { length: 3 }).notNull().default("AUD"),
  taxNumber: text("tax_number"), // ABN
  gstRateBp: integer("gst_rate_bp").notNull().default(1000), // basis points = 10%
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Property = typeof properties.$inferSelect
export type NewProperty = typeof properties.$inferInsert
