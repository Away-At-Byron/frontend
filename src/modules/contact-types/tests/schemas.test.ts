import { describe, expect, test } from "bun:test"
import { createContactTypeSchema, updateContactTypeSchema } from "../schemas"

describe("createContactTypeSchema", () => {
  test("requires a name", () => {
    expect(createContactTypeSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createContactTypeSchema.safeParse({}).success).toBe(false)
  })

  test("rejects a whitespace-only name", () => {
    expect(createContactTypeSchema.safeParse({ name: "   " }).success).toBe(
      false,
    )
  })

  test("trims surrounding whitespace", () => {
    const res = createContactTypeSchema.safeParse({ name: "  Corporate  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Corporate")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createContactTypeSchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name", () => {
    expect(
      createContactTypeSchema.safeParse({ name: "Travel Agent" }).success,
    ).toBe(true)
  })
})

describe("updateContactTypeSchema", () => {
  test("matches the create rules", () => {
    expect(updateContactTypeSchema.safeParse({ name: "Owner" }).success).toBe(
      true,
    )
    expect(updateContactTypeSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
