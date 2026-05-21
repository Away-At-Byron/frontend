import {
  pgTable,
  pgEnum,
  text,
  uuid,
  boolean,
  date,
  char,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { tenantCols } from "./_helpers"
import { properties } from "./properties"

/** Lucid: Contact Type (Guest, Housekeeper, Contractor) */
export const contactTypeEnum = pgEnum("contact_type", [
  "guest",
  "housekeeper",
  "contractor",
])

/** Lucid: Communication Preference (Email, SMS) */
export const communicationPreferenceEnum = pgEnum("communication_preference", [
  "email",
  "sms",
])

/**
 * Layer 1 — unified people record (FRS module 4).
 * Field set from the Lucid Contacts Data entity.
 */
export const contacts = pgTable(
  "contacts",
  {
    ...tenantCols,
    /** Display ref shown in the UI (e.g. G-1107), unique per property. */
    clientNumber: text("client_number").notNull(),
    clientSeq: integer("client_seq").notNull(),
    contactType: contactTypeEnum("contact_type").notNull().default("guest"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    addressStreet: text("address_street"),
    addressSuburb: text("address_suburb"),
    addressCity: text("address_city"),
    addressPostcode: text("address_postcode"),
    addressCountry: char("address_country", { length: 2 }).default("AU"),
    /** FK to bookings when that table exists; nullable until then. */
    bookingId: uuid("booking_id"),
    birthday: date("birthday", { mode: "date" }),
    communicationPreference: communicationPreferenceEnum(
      "communication_preference",
    )
      .notNull()
      .default("email"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    relatedClientId: uuid("related_client_id"),
    groupId: uuid("group_id"),
    groupName: text("group_name"),
    notes: text("notes"),
    returningGuest: boolean("returning_guest").notNull().default(false),
    /** Supports VIP filter in the contacts UI until tier rules live on bookings. */
    isVip: boolean("is_vip").notNull().default(false),
    /**
     * Portal access opt-in. OFF by default so the guest address book is not
     * silently a list of logins. Admins flip per row in the Contacts UI.
     */
    portalEnabled: boolean("portal_enabled").notNull().default(false),
    /** OTP-only sign-in (ADR-005). Same fields as users 2FA, plain text. */
    otp: text("otp"),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    otpAttempts: integer("otp_attempts").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("contacts_property_client_number").on(
      t.propertyId,
      t.clientNumber,
    ),
    uniqueIndex("contacts_property_client_seq").on(t.propertyId, t.clientSeq),
    // Email is the sign-in identifier; one address can only map to one row.
    // Partial unique on lower(email) since email is nullable.
    uniqueIndex("contacts_email_lower_unique")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} is not null`),
  ],
)

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
