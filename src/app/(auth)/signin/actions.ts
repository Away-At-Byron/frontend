"use server"

import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sendEmail } from "@/lib/email"
import { issueOtp } from "@/lib/otp"
import { ok, err, type ActionResult } from "@/lib/result"

const requestOtpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

/**
 * Step 1 of staff two-factor sign-in. Validates email + password (timing-safe
 * bcrypt even on missing user, per FRS §6.1 AC4) and, on success, issues a
 * fresh OTP via `issueOtp` and emails it.
 */
export async function requestOtp(input: unknown): Promise<ActionResult<{ issued: true }>> {
  const parsed = requestOtpSchema.safeParse(input)
  if (!parsed.success) {
    return err("VALIDATION", "Enter your email and password.")
  }

  const row = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1)

  const u = row[0]
  const hash = u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv"
  const valid = await bcrypt.compare(parsed.data.password, hash)
  if (!u || u.status !== "active" || !valid) {
    return err("UNAUTHENTICATED", "That email and password don't match. Try again.")
  }

  const { code } = await issueOtp("user", u.id)

  await sendEmail({
    to: u.email,
    subject: "Your Away at Byron sign-in code",
    text: [
      `Hi ${u.firstName},`,
      "",
      `Your sign-in code is ${code}. It expires in 10 minutes.`,
      "",
      "If you did not try to sign in, ignore this email and tell an admin.",
    ].join("\n"),
  })

  return ok({ issued: true })
}
