import { z } from "zod"
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
} from "@/lib/upload-limits"
import { PROPERTY_IMAGE_ROLES } from "./types"

const IMAGE_MIME_TYPES = ALLOWED_MIME_TYPES.filter((m) => m.startsWith("image/"))

const fileName = z
  .string()
  .trim()
  .min(1, "Required")
  .max(255)
  .refine((v) => !/[\\/]/.test(v), "File name can't contain / or \\")

const mimeType = z
  .string()
  .trim()
  .refine(
    (v) => (IMAGE_MIME_TYPES as readonly string[]).includes(v),
    `Image type isn't supported. Allowed: ${IMAGE_MIME_TYPES.join(", ")}`,
  )

const sizeBytes = z
  .number()
  .int()
  .positive()
  .max(
    MAX_FILE_BYTES,
    `Files must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller`,
  )

export const propertyImageRoleSchema = z.enum(PROPERTY_IMAGE_ROLES)

export const presignPropertyImageSchema = z.object({
  propertyId: z.string().uuid(),
  role: propertyImageRoleSchema,
  fileName,
  mimeType,
  sizeBytes,
})
export type PresignPropertyImageInput = z.infer<typeof presignPropertyImageSchema>

export const commitPropertyImageSchema = z.object({
  propertyId: z.string().uuid(),
  role: propertyImageRoleSchema,
  key: z.string().min(1).max(1024),
  fileName,
  mimeType,
  sizeBytes,
  widthPx: z.number().int().positive().max(20000).optional(),
  heightPx: z.number().int().positive().max(20000).optional(),
  caption: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
})
export type CommitPropertyImageInput = z.infer<typeof commitPropertyImageSchema>

export const updatePropertyImageSchema = z.object({
  caption: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
})
export type UpdatePropertyImageInput = z.infer<typeof updatePropertyImageSchema>
