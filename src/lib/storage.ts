import "server-only"
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"
import { env } from "@/lib/env"

/**
 * MinIO/S3 access for binary file storage. App rows hold metadata + `fileKey`;
 * bytes live here. CLAUDE.md ties us to MinIO in prod; the S3 SDK speaks both,
 * so the dev VS prod difference is only the endpoint URL.
 *
 * Upload pattern: presigned PUT. The Next server hands the client a short-lived
 * signed URL and the client uploads bytes straight to MinIO. This sidesteps the
 * 2 MB server-action body cap (see next.config.ts) and lets bulk uploads run in
 * parallel without pinning the app server.
 *
 * Public upload limits (max size, allowed mimes) live in `upload-limits.ts`
 * so client-safe Zod schemas can import them without pulling in the S3 SDK.
 */

export {
  MAX_FILE_BYTES,
  MAX_BULK_FILES,
  ALLOWED_MIME_TYPES,
  isAllowedMimeType,
  type AllowedMimeType,
} from "@/lib/upload-limits"

/** Presigned PUT URLs expire fast — clients should upload immediately. */
const UPLOAD_URL_TTL_SECONDS = 60 * 5

/** Presigned GET URLs are short-lived too — they're regenerated per click. */
const DOWNLOAD_URL_TTL_SECONDS = 60 * 5

let _client: S3Client | null = null

function client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    // MinIO uses path-style addressing (bucket in the path, not the subdomain).
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
  })
  return _client
}

/**
 * Strips path separators and trims to a sane length so a hostile filename
 * can't escape the prefix or blow out URL length limits.
 */
function safeFilename(name: string): string {
  const base = name.replace(/[\\/]+/g, "_").trim()
  return base.length > 200 ? base.slice(0, 200) : base || "file"
}

/**
 * Build a unique object key under a contact's prefix. Random UUID prevents
 * collisions if two staff upload the same filename; original name is appended
 * for human-readable bucket browsing during ops.
 */
export function buildContactDocumentKey(
  contactId: string,
  filename: string,
): string {
  return `contacts/${contactId}/${randomUUID()}/${safeFilename(filename)}`
}

/**
 * Property image key: `properties/{propertyId}/images/{role}/{uuid}/{file}`.
 * Role in the path (not just the row) so ops can ls one property's logos
 * without scanning every image, and so a future lifecycle rule can target
 * "all gallery photos older than X" cleanly.
 */
export function buildPropertyImageKey(
  propertyId: string,
  role: "logo" | "hero" | "gallery",
  filename: string,
): string {
  return `properties/${propertyId}/images/${role}/${randomUUID()}/${safeFilename(filename)}`
}

/** Property document key: `properties/{propertyId}/documents/{uuid}/{file}`. */
export function buildPropertyDocumentKey(
  propertyId: string,
  filename: string,
): string {
  return `properties/${propertyId}/documents/${randomUUID()}/${safeFilename(filename)}`
}

/**
 * Inventory item photo key: `inventory/{uuid}/{file}`. The UUID isolates each
 * upload so replacing a photo doesn't collide; the prior key is deleted by
 * the commit action.
 */
export function buildInventoryItemPhotoKey(filename: string): string {
  return `inventory/${randomUUID()}/${safeFilename(filename)}`
}

export type PresignedUpload = {
  key: string
  uploadUrl: string
  /** Headers the client MUST send on the PUT — preserves Content-Type binding. */
  headers: Record<string, string>
  expiresInSeconds: number
}

export async function presignUpload(opts: {
  key: string
  contentType: string
  contentLength: number
}): Promise<PresignedUpload> {
  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  })
  const uploadUrl = await getSignedUrl(client(), cmd, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    // Signing these headers means the client can't upload a different
    // content-type or length than was approved.
    signableHeaders: new Set(["content-type", "content-length"]),
  })
  return {
    key: opts.key,
    uploadUrl,
    headers: {
      "Content-Type": opts.contentType,
      "Content-Length": String(opts.contentLength),
    },
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
  }
}

export async function presignDownload(key: string): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
  return getSignedUrl(client(), cmd, { expiresIn: DOWNLOAD_URL_TTL_SECONDS })
}

export type ObjectInfo = {
  exists: boolean
  contentLength: number | null
  contentType: string | null
}

/**
 * Verifies the client actually completed the PUT before we write a DB row that
 * references the key. Returns size + type so we can detect tampering (client
 * claimed 2 MB, uploaded 25 MB).
 */
export async function headObjectInfo(key: string): Promise<ObjectInfo> {
  try {
    const res = await client().send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    )
    return {
      exists: true,
      contentLength: res.ContentLength ?? null,
      contentType: res.ContentType ?? null,
    }
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      ((e as { name?: string }).name === "NotFound" ||
        (e as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 404)
    ) {
      return { exists: false, contentLength: null, contentType: null }
    }
    throw e
  }
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  )
}

/**
 * Read an object into memory. Use sparingly — the file size cap (MAX_FILE_BYTES)
 * bounds the buffer, but a batch of large emails will pin RAM. Today only the
 * outbound email composer uses it, to inline attachments for nodemailer.
 */
export async function getObjectBytes(
  key: string,
): Promise<{ body: Buffer; contentType: string | null }> {
  const res = await client().send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  )
  const body = res.Body
  if (!body) throw new Error(`Empty body for ${key}`)
  const chunks: Buffer[] = []
  // S3 SDK in Node returns a Readable; iterate as Buffers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const chunk of body as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return {
    body: Buffer.concat(chunks),
    contentType: res.ContentType ?? null,
  }
}
