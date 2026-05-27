import { describe, expect, test } from "bun:test"
import { createGuestTypeSchema, updateGuestTypeSchema } from "../schemas"

describe("createGuestTypeSchema", () => {
  test("requires a name", () => {
    expect(createGuestTypeSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createGuestTypeSchema.safeParse({}).success).toBe(false)
  })

  test("trims whitespace", () => {
    const res = createGuestTypeSchema.safeParse({ name: "  Family  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Family")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createGuestTypeSchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name", () => {
    expect(
      createGuestTypeSchema.safeParse({ name: "Honeymoon" }).success,
    ).toBe(true)
  })
})

describe("updateGuestTypeSchema", () => {
  test("matches the create rules", () => {
    expect(updateGuestTypeSchema.safeParse({ name: "Couple" }).success).toBe(
      true,
    )
    expect(updateGuestTypeSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
