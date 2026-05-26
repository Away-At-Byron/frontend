/**
 * Client-safe upload limits. Lives outside `src/lib/storage.ts` so Zod schemas
 * (which run on both sides of the network) can import the caps without pulling
 * the S3 SDK and "server-only" into the client bundle.
 */

/** Hard cap per file. Tuned for ID scans, passports, signed PDFs. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

/** Cap on files per bulk call. Keeps presign batches snappy. */
export const MAX_BULK_FILES = 20

/**
 * Whitelist of mime types we accept. Conservative on purpose — front-desk staff
 * upload IDs, signed forms, and the occasional photo, not arbitrary binaries.
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value)
}
