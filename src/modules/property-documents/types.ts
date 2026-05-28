export type PropertyDocumentRow = {
  id: string
  propertyId: string
  title: string
  description: string | null
  fileKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string | null
  uploadedByName: string | null
  uploadedAt: string
  updatedAt: string
  /** Short-lived presigned GET URL, regenerated on each list. */
  downloadUrl: string
}
