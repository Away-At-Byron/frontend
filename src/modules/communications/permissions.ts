/**
 * In-portal chat is a sub-feature of contacts (FRS §6.24 extended). Reuse the
 * contact.* perm map rather than growing the shared role matrix:
 *   - view the thread / mark unread → contact.read
 *   - send a message               → contact.update
 */
export const MESSAGE_PERMISSIONS = {
  read: "contact.read",
  send: "contact.update",
} as const
