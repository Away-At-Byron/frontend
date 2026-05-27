import { describe, expect, test } from "bun:test"
import {
  createCostCategorySchema,
  updateCostCategorySchema,
} from "../schemas"

const UUID = "11111111-1111-1111-1111-111111111111"
const base = {
  name: "Standard",
  costTypeId: UUID,
  basis: "flat" as const,
  amount: 50,
  isOverridden: false,
  isActive: true,
}

describe("createCostCategorySchema", () => {
  test("accepts a valid row", () => {
    expect(createCostCategorySchema.safeParse(base).success).toBe(true)
  })

  test("requires a name and a cost type uuid", () => {
    expect(createCostCategorySchema.safeParse({ ...base, name: "" }).success).toBe(false)
    expect(createCostCategorySchema.safeParse({ ...base, costTypeId: "not-uuid" }).success).toBe(false)
  })

  test("basis must be one of the allowed values", () => {
    expect(
      createCostCategorySchema.safeParse({ ...base, basis: "weekly" as never })
        .success,
    ).toBe(false)
  })

  test("percentage amount must be 0-100", () => {
    const a = createCostCategorySchema.safeParse({
      ...base,
      basis: "percentage",
      amount: 50,
    })
    expect(a.success).toBe(true)
    const b = createCostCategorySchema.safeParse({
      ...base,
      basis: "percentage",
      amount: 101,
    })
    expect(b.success).toBe(false)
  })

  test("non-percentage amount just needs to be >= 0", () => {
    expect(
      createCostCategorySchema.safeParse({ ...base, amount: 5000 }).success,
    ).toBe(true)
    expect(
      createCostCategorySchema.safeParse({ ...base, amount: -1 }).success,
    ).toBe(false)
  })

  test("amount defaults to 0 when empty", () => {
    const res = createCostCategorySchema.safeParse({ ...base, amount: "" })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.amount).toBe(0)
  })
})

describe("updateCostCategorySchema", () => {
  test("matches the create rules", () => {
    expect(updateCostCategorySchema.safeParse(base).success).toBe(true)
  })
})
