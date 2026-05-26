import {
  pgTable,
  pgEnum,
  text,
  uuid,
  boolean,
  date,
  char,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./auth"
import { contactTypes } from "./contact-types"
import { contactSources } from "./contact-sources"
import { groups } from "./groups"

/** Communication Preference (Email, SMS, Both, None, Unsubscribed). */
export const communicationPreferenceEnum = pgEnum("communication_preference", [
  "email",
  "sms",
  "both",
  "none",
  "unsubscribed",
])

/** Government ID type — guests only (enforced in the contacts server actions). */
export const contactIdTypeEnum = pgEnum("contact_id_type", [
  "passport",
  "drivers_license",
  "national_id",
  "other",
])

/** Loyalty tier. Stored — replaces the old derived new/returning/vip logic. */
export const contactTierEnum = pgEnum("contact_tier", [
  "bronze",
  "silver",
  "gold",
  "vip",
])

/** Guest classification. */
export const guestTypeEnum = pgEnum("guest_type", [
  "leisure",
  "corporate",
  "family",
  "couple",
  "group",
  "vip",
  "event_guest",
])

/**
 * Layer 1 — unified people record (FRS module 4).
 *
 * NOT tenanted (ADR-006): contacts are global across all properties; the
 * property association is derived through `bookings`. So no `property_id`,
 * no `tenantCols`, no RLS policy. Columns are inlined here instead.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id), // nullable for system actions

    /** FK to the admin-managed contact_types catalogue. */
    contactTypeId: uuid("contact_type_id").references(() => contactTypes.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),

    addressStreet: text("address_street"),
    addressSuburb: text("address_suburb"),
    addressCity: text("address_city"),
    addressState: text("address_state"),
    addressPostcode: text("address_postcode"),
    addressCountry: char("address_country", { length: 2 }).default("AU"),

    /** Day + month only, no year. Stored "MM-DD". */
    birthday: char("birthday", { length: 5 }),
    communicationPreference: communicationPreferenceEnum("communication_preference")
      .notNull()
      .default("email"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),

    relatedClientId: uuid("related_client_id"),
    /** FK to the group this contact belongs to, if any. */
    groupId: uuid("group_id").references(() => groups.id),
    notes: text("notes"),

    /** Set true once the contact has more than one booking (Booking module). */
    returningGuest: boolean("returning_guest").notNull().default(false),

    // ── Government ID (guests only) ────────────────────────────
    idType: contactIdTypeEnum("id_type"),
    idNumber: text("id_number"),
    idCountry: text("id_country"),
    idVerified: boolean("id_verified").notNull().default(false),
    idVerificationDate: date("id_verification_date"),

    // ── Booking profile ───────────────────────────────────────
    firstBookingDate: date("first_booking_date"),
    preferredBookingChannel: text("preferred_booking_channel"),
    specialRequests: text("special_requests"),
    accessibilityRequirements: text("accessibility_requirements"),
    lastContactDate: date("last_contact_date"),
    doNotRebook: boolean("do_not_rebook").notNull().default(false),
    tier: contactTierEnum("tier"),
    /** FK to the admin-managed contact_sources catalogue. */
    contactSourceId: uuid("contact_source_id").references(() => contactSources.id),
    guestType: guestTypeEnum("guest_type"),

    /**
     * Portal access opt-in. OFF by default so the guest address book is not
     * silently a list of logins. Admins flip per row in the Contacts UI.
     */
    portalEnabled: boolean("portal_enabled").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    /**
     * Soft delete — flips instead of removing the row so historical bookings
     * and FK references to this contact stay intact. Matches `contact_types`.
     */
    isDeleted: boolean("is_deleted").notNull().default(false),
  },
  (t) => [
    // Email is the sign-in identifier; one address can only map to one row.
    // Partial unique on lower(email) since email is nullable.
    uniqueIndex("contacts_email_lower_unique")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} is not null`),
  ],
)

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
