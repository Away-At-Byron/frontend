/** Client-safe DTO types and enum value/label maps for contact documents. */

export const CONTACT_DOCUMENT_TYPES = [
  "id_photo",
  "booking_documents",
  "other_documents",
  "communication",
] as const
export type ContactDocumentType = (typeof CONTACT_DOCUMENT_TYPES)[number]

export const CONTACT_DOCUMENT_TYPE_LABELS: Record<ContactDocumentType, string> = {
  id_photo: "ID photo",
  booking_documents: "Booking document",
  other_documents: "Document",
  communication: "Communication",
}

export type ContactDocumentRow = {
  id: string
  contactId: string
  type: ContactDocumentType
  title: string
  description: string | null
  fileKey: string | null
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  uploadedBy: string | null
  uploadedByName: string | null
  createdAt: string
  updatedAt: string
}

/**
 * A document row enriched with a presigned GET URL. `previewUrl` is populated
 * server-side for image rows so the UI can render thumbnails without an extra
 * round trip; null for non-image rows (sign on click instead).
 */
export type ContactDocumentWithPreview = ContactDocumentRow & {
  previewUrl: string | null
}

