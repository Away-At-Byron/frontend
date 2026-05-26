# Contact documents

Files and notes attached to a contact (FRS module 4). Bytes live in MinIO under
`fileKey`; the row is metadata + audit trail.

## Upload flow (multi-file)

The client never POSTs file bytes through the Next server — the
`serverActions.bodySizeLimit` is 2 MB and we want bulk uploads to run in
parallel. Two server actions form a presign + confirm flow:

1. **`presignContactDocumentUploads({ contactId, files: [{fileName, mimeType, sizeBytes}, ...] })`**
   - Validates mime/size against the whitelist and 25 MB cap.
   - Returns one presigned PUT URL per file, with the headers the client must
     send. URLs expire in 5 minutes.
2. The client PUTs each file directly to its URL (parallel `fetch`).
3. **`confirmContactDocumentUploads({ contactId, items: [{key, type, title, ...}, ...] })`**
   - HEADs each object to confirm the upload landed and the size matches.
   - Inserts all rows in a single transaction; partial failure rolls back.
   - Orphan blobs on failure get cleaned by a MinIO lifecycle rule, not by us.

## Limits

| Limit | Value | Where set |
|---|---|---|
| Max bytes per file | 50 MB | `MAX_FILE_BYTES` in `src/lib/upload-limits.ts` |
| Max files per batch | 20 | `MAX_BULK_FILES` in `src/lib/upload-limits.ts` |
| Allowed mime types | PDF, images, Office docs, plain text/CSV | `ALLOWED_MIME_TYPES` in `src/lib/upload-limits.ts` |
| Presigned URL TTL | 5 minutes | `src/lib/storage.ts` |

## Permissions

Documents are a sub-resource of a contact — they reuse the `contact.*` perm map.

| Action | Permission |
|---|---|
| List / view / download | `contact.read` |
| Upload / edit metadata | `contact.update` |
| Delete (soft or hard)  | `contact.delete` |

## Server actions

- `presignContactDocumentUploads(input)` — issues presigned PUT URLs
- `confirmContactDocumentUploads(input)` — writes rows after upload
- `updateContactDocument(id, input)` — edits title/description/type
- `deleteContactDocument(id)` — soft delete (sets `is_deleted`)
- `deleteContactDocumentHard(id)` — drops row + MinIO blob (privacy erasure)

## Queries

- `listContactDocuments(contactId)` — non-deleted, newest first
- `getContactDocument(id)`
- `getContactDocumentDownloadUrl(id)` — short-lived presigned GET URL

## Open questions

- Lifecycle rule for reaping orphaned blobs (multipart aborts, confirm-step
  failures) — needs to live in the MinIO bucket config, tracked in the
  `backend` repo.
- Antivirus scan on upload? Out of scope for v1; revisit if Jenny asks.
