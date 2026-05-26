/** Client-safe DTO types and enum value/label maps for contact documents. */

export const CONTACT_DOCUMENT_TYPES = ["other_documents", "communication"] as const
export type ContactDocumentType = (typeof CONTACT_DOCUMENT_TYPES)[number]

export const CONTACT_DOCUMENT_TYPE_LABELS: Record<ContactDocumentType, string> = {
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
