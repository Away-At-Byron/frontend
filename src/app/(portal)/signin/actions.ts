"use server"

import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { contacts } from "@/db/schema"
import { sendEmail } from "@/lib/email"
import { ok, err, type ActionResult } from "@/lib/result"

const requestContactOtpSchema = z.object({
  email: z.string().email(),
})

/**
 * Portal sign-in step 1. Always returns ok to avoid leaking which addresses
 * are in the contact book — the OTP is only written + emailed when the
 * lookup matches a portal-enabled contact.
 */
export async function requestContactOtp(
  input: unknown,
): Promise<ActionResult<{ issued: true }>> {
  const parsed = requestContactOtpSchema.safeParse(input)
  if (!parsed.success) return err("VALIDATION", "Enter your email.")

  const emailLower = parsed.data.email.toLowerCase()
  const row = await db
    .select({
      id: contacts.id,
      email: contacts.email,
      firstName: contacts.firstName,
      portalEnabled: contacts.portalEnabled,
    })
    .from(contacts)
    .where(eq(contacts.email, emailLower))
    .limit(1)

  const c = row[0]
  if (c && c.portalEnabled && c.email) {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db
      .update(contacts)
      .set({ otp, otpExpiresAt: expiresAt, otpAttempts: 0, updatedAt: new Date() })
      .where(eq(contacts.id, c.id))

    await sendEmail({
      to: c.email,
      subject: "Your Away at Byron sign-in code",
      text: [
        `Hi ${c.firstName},`,
        "",
        `Your sign-in code is ${otp}. It expires in 10 minutes.`,
        "",
        "If you did not try to sign in, ignore this email.",
      ].join("\n"),
    })
  }

  return ok({ issued: true })
}
