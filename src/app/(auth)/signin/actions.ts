"use server"

import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sendEmail } from "@/lib/email"
import { ok, err, type ActionResult } from "@/lib/result"

const requestOtpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

/**
 * Step 1 of two-factor sign-in. Validates email + password and, on success,
 * stores a fresh OTP on the user row and emails it. Identical response shape
 * on bad creds vs. inactive users — same anti-enumeration treatment as the
 * NextAuth `authorize` path.
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
  // Always run bcrypt to avoid timing side-channel (FRS §6.1 AC4).
  const hash = u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv"
  const valid = await bcrypt.compare(parsed.data.password, hash)
  if (!u || u.status !== "active" || !valid) {
    return err("UNAUTHENTICATED", "That email and password don't match. Try again.")
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000)) // 6 digits
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  await db
    .update(users)
    .set({ otp, otpExpiresAt: expiresAt, otpAttempts: 0, updatedAt: new Date() })
    .where(eq(users.id, u.id))

  await sendEmail({
    to: u.email,
    subject: "Your Away at Byron sign-in code",
    text: [
      `Hi ${u.firstName},`,
      "",
      `Your sign-in code is ${otp}. It expires in 10 minutes.`,
      "",
      "If you did not try to sign in, ignore this email and tell an admin.",
    ].join("\n"),
  })

  return ok({ issued: true })
}
