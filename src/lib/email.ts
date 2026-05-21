import "server-only"
import nodemailer, { type Transporter } from "nodemailer"
import { env } from "@/lib/env"

export type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error(
      "EMAIL_TRANSPORT=smtp but SMTP_HOST / SMTP_USER / SMTP_PASS are not set",
    )
  }
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  return cachedTransporter
}

/**
 * Outbound email. EMAIL_TRANSPORT=console prints to stdout (dev default).
 * EMAIL_TRANSPORT=smtp sends through the configured relay (Postal, Gmail
 * SMTP, SES, anything that speaks SMTP).
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

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  })
}
