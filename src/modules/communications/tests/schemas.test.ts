import { describe, expect, test } from "bun:test"
import { MAX_BULK_FILES, MAX_FILE_BYTES } from "@/lib/upload-limits"
import { sendMessageSchema } from "../schemas"

const validUuid = "11111111-1111-1111-1111-111111111111"

const validAttachment = {
  key: `contacts/${validUuid}/abc/note.pdf`,
  fileName: "note.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
}

describe("sendMessageSchema", () => {
  test("accepts a plain text message", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "Hi Liliana, your room is ready.",
    })
    expect(res.success).toBe(true)
  })

  test("accepts a message with attachments", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "Here's the booking summary.",
      attachments: [validAttachment],
    })
    expect(res.success).toBe(true)
  })

  test("requires a non-empty body", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "   ",
    })
    expect(res.success).toBe(false)
  })

  test("rejects an absurdly long body", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "x".repeat(8001),
    })
    expect(res.success).toBe(false)
  })

  test("rejects a non-uuid contactId", () => {
    const res = sendMessageSchema.safeParse({
      contactId: "not-a-uuid",
      body: "hello",
    })
    expect(res.success).toBe(false)
  })

  test("rejects more attachments than the bulk cap", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "lots of files",
      attachments: Array.from({ length: MAX_BULK_FILES + 1 }, () => validAttachment),
    })
    expect(res.success).toBe(false)
  })

  test("rejects an attachment over the size cap", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "big file",
      attachments: [{ ...validAttachment, sizeBytes: MAX_FILE_BYTES + 1 }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects an attachment with a disallowed mime type", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "exe",
      attachments: [{ ...validAttachment, mimeType: "application/x-msdownload" }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects path separators in attachment file names", () => {
    const res = sendMessageSchema.safeParse({
      contactId: validUuid,
      body: "sneaky",
      attachments: [{ ...validAttachment, fileName: "../etc/passwd" }],
    })
    expect(res.success).toBe(false)
  })
})
