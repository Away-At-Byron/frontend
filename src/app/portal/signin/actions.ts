"use server"

import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { contacts } from "@/db/schema"
import { sendEmail } from "@/lib/email"
import { issueOtp } from "@/lib/otp"
import { ok, err, type ActionResult } from "@/lib/result"

const requestContactOtpSchema = z.object({
  email: z.string().email(),
})

/**
 * Portal sign-in step 1. Surfaces a "portal not active" warning when the
 * email is missing or `portal_enabled = false`, so legitimate contacts
 * know to ask an admin rather than staring at a dead OTP form. The two
 * "no" cases share one message to limit address-book enumeration to a
 * single bit (in vs. out).
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
  if (!c || !c.portalEnabled || !c.email) {
    return err(
      "FORBIDDEN",
      "Portal access isn't active for this email. Ask an admin to enable it.",
    )
  }

  const { code } = await issueOtp("contact", c.id)

  await sendEmail({
    to: c.email,
    subject: "Your Away at Byron sign-in code",
    text: [
      `Hi ${c.firstName},`,
      "",
      `Your sign-in code is ${code}. It expires in 10 minutes.`,
      "",
      "If you did not try to sign in, ignore this email.",
    ].join("\n"),
  })

  return ok({ issued: true })
}
