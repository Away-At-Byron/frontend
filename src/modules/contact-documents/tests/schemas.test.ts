import { describe, expect, test } from "bun:test"
import { MAX_BULK_FILES, MAX_FILE_BYTES } from "@/lib/upload-limits"
import {
  confirmUploadsSchema,
  presignUploadsSchema,
  updateContactDocumentSchema,
} from "../schemas"

const validUuid = "11111111-1111-1111-1111-111111111111"

const validFile = {
  fileName: "passport.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
}

describe("presignUploadsSchema", () => {
  test("accepts a single valid file", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: [validFile],
    })
    expect(res.success).toBe(true)
  })

  test("rejects an empty file list", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: [],
    })
    expect(res.success).toBe(false)
  })

  test("rejects more than the bulk cap", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: Array.from({ length: MAX_BULK_FILES + 1 }, () => validFile),
    })
    expect(res.success).toBe(false)
  })

  test("rejects a file over the size cap", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: [{ ...validFile, sizeBytes: MAX_FILE_BYTES + 1 }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects a disallowed mime type", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: [{ ...validFile, mimeType: "application/x-msdownload" }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects filenames with path separators", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: validUuid,
      files: [{ ...validFile, fileName: "../etc/passwd" }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects a non-uuid contactId", () => {
    const res = presignUploadsSchema.safeParse({
      contactId: "not-a-uuid",
      files: [validFile],
    })
    expect(res.success).toBe(false)
  })
})

describe("confirmUploadsSchema", () => {
  const validItem = {
    key: `contacts/${validUuid}/abc/passport.pdf`,
    type: "other_documents" as const,
    title: "Passport scan",
    fileName: "passport.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
  }

  test("accepts a valid bulk confirm", () => {
    const res = confirmUploadsSchema.safeParse({
      contactId: validUuid,
      items: [validItem, { ...validItem, title: "Drivers licence" }],
    })
    expect(res.success).toBe(true)
  })

  test("requires a title", () => {
    const res = confirmUploadsSchema.safeParse({
      contactId: validUuid,
      items: [{ ...validItem, title: "" }],
    })
    expect(res.success).toBe(false)
  })

  test("rejects an unknown document type", () => {
    const res = confirmUploadsSchema.safeParse({
      contactId: validUuid,
      items: [{ ...validItem, type: "bogus" }],
    })
    expect(res.success).toBe(false)
  })
})

describe("updateContactDocumentSchema", () => {
  test("trims optional description to undefined when blank", () => {
    const res = updateContactDocumentSchema.safeParse({
      type: "communication",
      title: "Follow-up call",
      description: "   ",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.description).toBeUndefined()
  })

  test("title is required", () => {
    const res = updateContactDocumentSchema.safeParse({
      type: "other_documents",
      title: "",
    })
    expect(res.success).toBe(false)
  })
})
