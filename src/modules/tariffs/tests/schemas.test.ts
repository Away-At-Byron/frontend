import { describe, expect, test } from "bun:test"
import { createTariffSchema, updateTariffSchema } from "../schemas"

describe("createTariffSchema", () => {
  test("requires a name", () => {
    expect(createTariffSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createTariffSchema.safeParse({}).success).toBe(false)
  })

  test("trims whitespace", () => {
    const res = createTariffSchema.safeParse({ name: "  Weekend Rate  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Weekend Rate")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createTariffSchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name", () => {
    expect(
      createTariffSchema.safeParse({ name: "Peak Season" }).success,
    ).toBe(true)
  })
})

describe("updateTariffSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateTariffSchema.safeParse({ name: "Non-Refundable" }).success,
    ).toBe(true)
    expect(updateTariffSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
