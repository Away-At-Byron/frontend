import { z } from "zod"
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
} from "@/lib/upload-limits"

const title = z.string().trim().min(1, "Required").max(200)
const description = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .transform((v) => (v ? v : undefined))

const mimeType = z
  .string()
  .trim()
  .refine(
    (v) => (ALLOWED_MIME_TYPES as readonly string[]).includes(v),
    `File type isn't supported. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
  )

const fileName = z
  .string()
  .trim()
  .min(1, "Required")
  .max(255)
  .refine((v) => !/[\\/]/.test(v), "File name can't contain / or \\")

const sizeBytes = z
  .number()
  .int()
  .positive()
  .max(
    MAX_FILE_BYTES,
    `Files must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller`,
  )

const presignFileSchema = z.object({ fileName, mimeType, sizeBytes })

export const presignPropertyDocumentUploadsSchema = z.object({
  propertyId: z.string().uuid(),
  files: z
    .array(presignFileSchema)
    .min(1, "Pick at least one file")
    .max(MAX_BULK_FILES, `Upload up to ${MAX_BULK_FILES} files at once`),
})
export type PresignPropertyDocumentUploadsInput = z.infer<
  typeof presignPropertyDocumentUploadsSchema
>

const confirmItemSchema = z.object({
  key: z.string().min(1).max(1024),
  title,
  description,
  fileName,
  mimeType,
  sizeBytes,
})

export const confirmPropertyDocumentUploadsSchema = z.object({
  propertyId: z.string().uuid(),
  items: z.array(confirmItemSchema).min(1).max(MAX_BULK_FILES),
})
export type ConfirmPropertyDocumentUploadsInput = z.infer<
  typeof confirmPropertyDocumentUploadsSchema
>

export const updatePropertyDocumentSchema = z.object({
  title,
  description,
})
export type UpdatePropertyDocumentInput = z.infer<
  typeof updatePropertyDocumentSchema
>
