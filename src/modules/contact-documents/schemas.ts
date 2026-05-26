import { z } from "zod"
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
} from "@/lib/upload-limits"
import { CONTACT_DOCUMENT_TYPES } from "./types"

const title = z.string().trim().min(1, "Required").max(200)
const description = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v ? v : undefined))

export const contactDocumentTypeSchema = z.enum(CONTACT_DOCUMENT_TYPES)

const mimeTypeSchema = z
  .string()
  .trim()
  .refine(
    (v) => (ALLOWED_MIME_TYPES as readonly string[]).includes(v),
    `File type isn't supported. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
  )

const fileNameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(255)
  // No path separators — buildContactDocumentKey strips them, but reject early
  // so the error surfaces in the form rather than producing a sanitised key.
  .refine((v) => !/[\\/]/.test(v), "File name can't contain / or \\")

const sizeBytesSchema = z
  .number()
  .int()
  .positive()
  .max(MAX_FILE_BYTES, `Files must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller`)

const presignFileSchema = z.object({
  fileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: sizeBytesSchema,
})

export const presignUploadsSchema = z.object({
  contactId: z.string().uuid(),
  files: z
    .array(presignFileSchema)
    .min(1, "Pick at least one file")
    .max(MAX_BULK_FILES, `Upload up to ${MAX_BULK_FILES} files at once`),
})

export type PresignUploadsInput = z.infer<typeof presignUploadsSchema>

const confirmItemSchema = z.object({
  key: z.string().min(1).max(1024),
  type: contactDocumentTypeSchema,
  title,
  description,
  fileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: sizeBytesSchema,
})

export const confirmUploadsSchema = z.object({
  contactId: z.string().uuid(),
  items: z
    .array(confirmItemSchema)
    .min(1)
    .max(MAX_BULK_FILES),
})

export type ConfirmUploadsInput = z.infer<typeof confirmUploadsSchema>

export const updateContactDocumentSchema = z.object({
  type: contactDocumentTypeSchema,
  title,
  description,
})

export type UpdateContactDocumentInput = z.infer<typeof updateContactDocumentSchema>
