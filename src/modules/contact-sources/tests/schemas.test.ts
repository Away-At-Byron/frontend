import { describe, expect, test } from "bun:test"
import { createContactSourceSchema, updateContactSourceSchema } from "../schemas"

describe("createContactSourceSchema", () => {
  test("requires a name", () => {
    expect(createContactSourceSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createContactSourceSchema.safeParse({}).success).toBe(false)
  })

  test("rejects a whitespace-only name", () => {
    expect(createContactSourceSchema.safeParse({ name: "   " }).success).toBe(
      false,
    )
  })

  test("trims surrounding whitespace", () => {
    const res = createContactSourceSchema.safeParse({ name: "  Referral  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Referral")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createContactSourceSchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name", () => {
    expect(
      createContactSourceSchema.safeParse({ name: "Social Media" }).success,
    ).toBe(true)
  })
})

describe("updateContactSourceSchema", () => {
  test("matches the create rules", () => {
    expect(updateContactSourceSchema.safeParse({ name: "OTA" }).success).toBe(
      true,
    )
    expect(updateContactSourceSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
