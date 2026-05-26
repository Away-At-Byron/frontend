/**
 * Documents are a sub-resource of a contact. Reuse the contact.* perm map so
 * we don't grow the role matrix for every nested resource:
 *   - upload / edit metadata → contact.update
 *   - download / list        → contact.read
 *   - delete                 → contact.delete
 */
export const CONTACT_DOCUMENT_PERMISSIONS = {
  read: "contact.read",
  upload: "contact.update",
  update: "contact.update",
  delete: "contact.delete",
} as const
