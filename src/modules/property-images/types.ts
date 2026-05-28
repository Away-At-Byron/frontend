export const PROPERTY_IMAGE_ROLES = ["logo", "hero", "gallery"] as const
export type PropertyImageRole = (typeof PROPERTY_IMAGE_ROLES)[number]

export type PropertyImageRow = {
  id: string
  propertyId: string
  role: PropertyImageRole
  fileKey: string
  mimeType: string | null
  sizeBytes: number | null
  widthPx: number | null
  heightPx: number | null
  caption: string | null
  sortOrder: number
  uploadedAt: string
  /** Short-lived presigned GET URL, regenerated on each list. */
  downloadUrl: string
}
