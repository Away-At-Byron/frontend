/** Client-safe DTO types for in-portal staff↔contact chat. */

export const MESSAGE_SENDER_TYPES = ["user", "contact"] as const
export type MessageSenderType = (typeof MESSAGE_SENDER_TYPES)[number]

export type ConversationRow = {
  id: string
  contactId: string
  lastMessageAt: string | null
  lastMessageSenderType: MessageSenderType | null
  createdAt: string
  updatedAt: string
  /** Derived: is the latest message from the contact? Drives staff inbox badge. */
  unreadForStaff: boolean
}

export type MessageAttachment = {
  id: string
  fileName: string | null
  mimeType: string | null
  sizeBytes: number | null
  /** Eager-signed GET URL for image attachments; null otherwise (sign on click). */
  previewUrl: string | null
}

export type MessageRow = {
  id: string
  conversationId: string
  senderType: MessageSenderType
  senderUserId: string | null
  senderContactId: string | null
  /**
   * Display name of the sender at read time. Joined from users (firstName +
   * lastName) or contacts (firstName + lastName). Null if the original user
   * or contact has been hard-deleted (FK is ON DELETE SET NULL).
   */
  senderName: string | null
  body: string
  createdAt: string
  attachments: MessageAttachment[]
}
