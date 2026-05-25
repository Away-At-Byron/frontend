import { describe, expect, test } from "bun:test"
import { createGroupSchema, updateGroupSchema } from "../schemas"

describe("createGroupSchema", () => {
  test("requires a group name", () => {
    const res = createGroupSchema.safeParse({ groupName: "" })
    expect(res.success).toBe(false)
  })

  test("accepts a minimal group", () => {
    const res = createGroupSchema.safeParse({ groupName: "The Smiths" })
    expect(res.success).toBe(true)
    if (res.success) {
      // groupBookerFlag defaults to false.
      expect(res.data.groupBookerFlag).toBe(false)
      // Optional text fields drop empty strings to undefined.
      expect(res.data.companyName).toBeUndefined()
    }
  })

  test("trims and preserves optional fields", () => {
    const res = createGroupSchema.safeParse({
      groupName: "  Acme corporate  ",
      companyName: "Acme Pty Ltd",
      taxAbn: "12 345 678 901",
      groupBookerFlag: true,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.groupName).toBe("Acme corporate")
      expect(res.data.companyName).toBe("Acme Pty Ltd")
      expect(res.data.groupBookerFlag).toBe(true)
    }
  })

  test("rejects a name longer than 120 chars", () => {
    const res = createGroupSchema.safeParse({ groupName: "x".repeat(121) })
    expect(res.success).toBe(false)
  })
})

describe("updateGroupSchema", () => {
  test("same shape as create — name still required", () => {
    const res = updateGroupSchema.safeParse({ groupName: "" })
    expect(res.success).toBe(false)
  })

  test("accepts the full editable payload", () => {
    const res = updateGroupSchema.safeParse({
      groupName: "Henderson family",
      relationships: "Parents + two adult children",
      companyName: "",
      corporateAccountId: "",
      travelAgentId: "",
      groupBookerFlag: false,
      billingPreference: "Master account",
      taxAbn: "",
    })
    expect(res.success).toBe(true)
  })
})
