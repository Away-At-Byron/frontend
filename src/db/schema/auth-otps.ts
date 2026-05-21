import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/**
 * The kind of identity an OTP was issued to. Polymorphic so the table works
 * for both staff (`users`) and portal contacts (`contacts`) without
 * duplicating the schema. No FK — referential integrity is enforced in
 * application code via the typed enum.
 */
export const otpSubjectType = pgEnum("otp_subject_type", ["user", "contact"])

/**
 * Layer 0 — pre-auth OTP challenges (ADR-004 + ADR-005).
 *
 * One outstanding code per identity at a time (enforced by the partial
 * unique index below). On a new issue we mark any prior unconsumed row as
 * consumed and insert a fresh row, so the table doubles as an audit
 * history of who tried to sign in and when.
 *
 * Plain-text code by product decision; bounded by short TTL and the
 * attempts cap. Rotate to hashed if history retention grows.
 */
export const authOtps = pgTable(
  "auth_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectType: otpSubjectType("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Set when the code is verified, expired-out by a new issue, or hits the attempts cap. */
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("auth_otps_active_one_per_subject")
      .on(t.subjectType, t.subjectId)
      .where(sql`${t.consumedAt} is null`),
    index("auth_otps_subject_idx").on(t.subjectType, t.subjectId),
  ],
)

export type AuthOtp = typeof authOtps.$inferSelect
export type NewAuthOtp = typeof authOtps.$inferInsert
export type OtpSubjectType = (typeof otpSubjectType.enumValues)[number]
