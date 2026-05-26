# Communications (in-portal chat)

In-portal staff↔contact messaging for the Communication tab on the contact
detail page (and, eventually, the contact's `/portal/messages` view).

> **Scope note.** FRS §6.24 specifies a "Communication Log (v1, logging only)".
> This module extends that to a two-way in-portal chat per a session decision
> (Liliana sends Mary a message about her booking, Mary replies). Trigger
> automation FSM, email/SMS push, and notifications remain Phase 2.

## Data model

- **`conversations`** — one per contact (UNIQUE on `contact_id`). Carries
  denormalised `last_message_at` + `last_message_sender_type` so the staff
  inbox can sort and badge "unread" without joining `messages`.
- **`messages`** — append-only. `sender_type` enum is `('user', 'contact')`.
  Exactly one of `sender_user_id` / `sender_contact_id` is non-null, matching
  `sender_type` (DB CHECK constraint `messages_sender_xor_chk` enforces it).
  No `is_deleted` column — messages are audit-trail.
- **`contact_documents.message_id`** — nullable FK to `messages.id`. Populated
  by `sendMessage` when attachments are sent; non-comms rows leave it null.

Both tables are **global, not tenanted** (ADR-006 — contacts are global, so
their conversations follow).

## Unread heuristic

No per-user `read_states` table. The unread badge is derived from the
denormalised pointer:

- Staff inbox: `unreadForStaff = (last_message_sender_type === "contact")`.
  Any staff reply flips the column to `"user"`, clearing the badge for all
  staff. This is exactly the spec the session decided on.
- Contact portal (mirrored): `unreadForContact = (last_message_sender_type === "user")`.

If per-user read state ever becomes a requirement, add a separate
`conversation_read_states` table — the messages schema doesn't need to change.

## Permissions

Reuses `contact.*` so we don't grow the shared role matrix:

| Action | Permission |
|---|---|
| Read thread / view inbox | `contact.read` |
| Send message (with or without attachments) | `contact.update` |

## Public API

- `getConversationByContact(contactId)` — returns the conversation row (or
  null if no messages yet). Lightweight; safe to call on the contact detail
  page to render the badge.
- `listMessages(conversationId)` — full message history oldest-first, with
  attachments inlined and image attachments eager-signed.
- `sendMessage({ contactId, body, attachments? })` — lazily creates the
  conversation, inserts the message + attachment rows in one transaction, and
  updates the denormalised pointer. `attachments[]` references MinIO keys
  already PUT via the existing presign flow.

## Open questions

- Email/SMS notification when the contact replies (Phase 2).
- Search across messages (consider `pg_trgm` once volumes warrant it).
- Per-user read receipts (separate table; not built yet).
- Staff-to-staff DMs are deliberately **not** covered by this schema — see
  the session note in commit history. Would be a sibling module.
