import "server-only"
import { env } from "@/lib/env"

export type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Minimal outbound email. EMAIL_TRANSPORT=console (the dev default) prints
 * to stdout so devs can read OTPs without wiring SMTP. SMTP (Postal) lands
 * with the comms module.
 */
export async function sendEmail(msg: EmailPayload): Promise<void> {
  if (env.EMAIL_TRANSPORT === "console") {
    console.log(
      `\n[email] from=${env.EMAIL_FROM} to=${msg.to}\n` +
        `        subject=${msg.subject}\n` +
        `${msg.text.split("\n").map((l) => `        ${l}`).join("\n")}\n`,
    )
    return
  }
  throw new Error(`EMAIL_TRANSPORT=${env.EMAIL_TRANSPORT} not implemented yet`)
}
