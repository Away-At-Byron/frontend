import "server-only"
import nodemailer, { type Transporter } from "nodemailer"
import { env } from "@/lib/env"

export type EmailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export type EmailPayload = {
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  text: string
  html?: string
  attachments?: EmailAttachment[]
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
  const toList = Array.isArray(msg.to) ? msg.to.join(", ") : msg.to
  if (env.EMAIL_TRANSPORT === "console") {
    const cc = msg.cc?.length ? `\n        cc=${msg.cc.join(", ")}` : ""
    const bcc = msg.bcc?.length ? `\n        bcc=${msg.bcc.join(", ")}` : ""
    const att = msg.attachments?.length
      ? `\n        attachments=${msg.attachments.map((a) => `${a.filename}(${a.content.byteLength}B)`).join(", ")}`
      : ""
    console.log(
      `\n[email] from=${env.EMAIL_FROM} to=${toList}${cc}${bcc}\n` +
        `        subject=${msg.subject}${att}\n` +
        `${msg.text.split("\n").map((l) => `        ${l}`).join("\n")}\n`,
    )
    return
  }

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: msg.to,
    cc: msg.cc,
    bcc: msg.bcc,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
    attachments: msg.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  })
}
