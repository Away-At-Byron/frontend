import { describe, expect, test } from "bun:test"
import {
  createCostCategorySchema,
  updateCostCategorySchema,
} from "../schemas"

describe("createCostCategorySchema", () => {
  test("accepts a valid row", () => {
    expect(
      createCostCategorySchema.safeParse({ name: "Housekeeping" }).success,
    ).toBe(true)
  })

  test("requires a name", () => {
    expect(createCostCategorySchema.safeParse({ name: "" }).success).toBe(false)
  })

  test("trims whitespace on name", () => {
    const res = createCostCategorySchema.safeParse({ name: "  Linen  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Linen")
  })

  test("rejects names over 80 characters", () => {
    expect(
      createCostCategorySchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })
})

describe("updateCostCategorySchema", () => {
  test("matches the create rules", () => {
    expect(updateCostCategorySchema.safeParse({ name: "Damages" }).success).toBe(true)
    expect(updateCostCategorySchema.safeParse({ name: "" }).success).toBe(false)
  })
})
