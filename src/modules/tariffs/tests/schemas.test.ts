import { describe, expect, test } from "bun:test"
import { createTariffSchema, updateTariffSchema } from "../schemas"

describe("createTariffSchema", () => {
  test("requires a name", () => {
    expect(
      createTariffSchema.safeParse({ name: "", traffic: "direct" }).success,
    ).toBe(false)
    expect(createTariffSchema.safeParse({ traffic: "direct" }).success).toBe(
      false,
    )
  })

  test("trims whitespace", () => {
    const res = createTariffSchema.safeParse({
      name: "  Weekend Rate  ",
      traffic: "direct",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Weekend Rate")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createTariffSchema.safeParse({
        name: "x".repeat(81),
        traffic: "direct",
      }).success,
    ).toBe(false)
  })

  test("requires a traffic value", () => {
    expect(createTariffSchema.safeParse({ name: "Peak Season" }).success).toBe(
      false,
    )
  })

  test("rejects an unknown traffic value", () => {
    expect(
      createTariffSchema.safeParse({
        name: "Peak Season",
        traffic: "agoda",
      }).success,
    ).toBe(false)
  })

  test("accepts every valid traffic value", () => {
    for (const traffic of ["ota", "direct", "other"] as const) {
      expect(
        createTariffSchema.safeParse({ name: "Peak Season", traffic }).success,
      ).toBe(true)
    }
  })
})

describe("updateTariffSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateTariffSchema.safeParse({
        name: "Non-Refundable",
        traffic: "ota",
      }).success,
    ).toBe(true)
    expect(
      updateTariffSchema.safeParse({ name: "", traffic: "ota" }).success,
    ).toBe(false)
  })
})
