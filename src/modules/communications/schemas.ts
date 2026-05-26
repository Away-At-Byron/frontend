import { z } from "zod"
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
} from "@/lib/upload-limits"

/**
 * Outgoing message from a staff user. Body is required (use the attachment
 * filename or a placeholder if you want an attachment-only message — keeping
 * the column NOT NULL means the audit log always has something readable).
 */
export const sendMessageSchema = z.object({
  contactId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a message").max(8000, "Message is too long"),
  /**
   * Optional. Each entry references a MinIO object the client already PUT via
   * presignContactDocumentUploads. The server HEADs each key and writes a
   * contact_documents row linked to the new message in the same transaction.
   */
  attachments: z
    .array(
      z.object({
        key: z.string().min(1).max(1024),
        fileName: z
          .string()
          .trim()
          .min(1, "Required")
          .max(255)
          .refine((v) => !/[\\/]/.test(v), "File name can't contain / or \\"),
        mimeType: z
          .string()
          .trim()
          .refine(
            (v) => (ALLOWED_MIME_TYPES as readonly string[]).includes(v),
            `File type isn't supported. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
          ),
        sizeBytes: z
          .number()
          .int()
          .positive()
          .max(
            MAX_FILE_BYTES,
            `Files must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller`,
          ),
      }),
    )
    .max(MAX_BULK_FILES, `Attach up to ${MAX_BULK_FILES} files at once`)
    .optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

/**
 * Contact-side variant. The contact id is derived from the signed-in session,
 * not user input — a contact can never address a thread they don't own.
 */
export const sendMessageAsContactSchema = sendMessageSchema.omit({
  contactId: true,
})

export type SendMessageAsContactInput = z.infer<typeof sendMessageAsContactSchema>

// ─── Outbound email (Compose Email modal — Contact > Communication) ─────

/**
 * `to` is enforced server-side from the contact record so a typo on the
 * client can't redirect the email elsewhere. Cc / Bcc are optional and
 * tolerate comma- or newline-separated input from the form.
 */
const emailListSchema = z
  .array(z.string().trim().email("One of the addresses isn't valid"))
  .max(20, "Up to 20 addresses per field")
  .optional()

export const sendContactEmailSchema = z.object({
  contactId: z.string().uuid(),
  subject: z
    .string()
    .trim()
    .min(1, "Add a subject")
    .max(255, "Subject is too long"),
  body: z.string().trim().min(1, "Write a message").max(20000, "Body is too long"),
  cc: emailListSchema,
  bcc: emailListSchema,
  /** Optional MinIO attachments — same presign / HEAD pattern as messages. */
  attachments: z
    .array(
      z.object({
        key: z.string().min(1).max(1024),
        fileName: z
          .string()
          .trim()
          .min(1, "Required")
          .max(255)
          .refine((v) => !/[\\/]/.test(v), "File name can't contain / or \\"),
        mimeType: z
          .string()
          .trim()
          .refine(
            (v) => (ALLOWED_MIME_TYPES as readonly string[]).includes(v),
            `File type isn't supported. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
          ),
        sizeBytes: z
          .number()
          .int()
          .positive()
          .max(
            MAX_FILE_BYTES,
            `Files must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller`,
          ),
      }),
    )
    .max(MAX_BULK_FILES, `Attach up to ${MAX_BULK_FILES} files at once`)
    .optional(),
})

export type SendContactEmailInput = z.infer<typeof sendContactEmailSchema>
