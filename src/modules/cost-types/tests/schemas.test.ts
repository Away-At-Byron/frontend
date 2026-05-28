import { describe, expect, test } from "bun:test"
import {
  createCostTypeSchema,
  updateCostTypeSchema,
} from "../schemas"

const UUID = "11111111-1111-1111-1111-111111111111"
const base = {
  name: "Standard linen change",
  costCategoryId: UUID,
  basis: "flat" as const,
  defaultValue: 50,
  canBeOverridden: true,
  isActive: true,
}

describe("createCostTypeSchema", () => {
  test("accepts a valid row", () => {
    expect(createCostTypeSchema.safeParse(base).success).toBe(true)
  })

  test("requires a name and a cost category uuid", () => {
    expect(createCostTypeSchema.safeParse({ ...base, name: "" }).success).toBe(false)
    expect(
      createCostTypeSchema.safeParse({ ...base, costCategoryId: "not-uuid" }).success,
    ).toBe(false)
  })

  test("trims whitespace on name", () => {
    const res = createCostTypeSchema.safeParse({ ...base, name: "  OTA  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("OTA")
  })

  test("basis must be one of the allowed values", () => {
    expect(
      createCostTypeSchema.safeParse({ ...base, basis: "weekly" as never }).success,
    ).toBe(false)
  })

  test("percentage default value must be 0-100", () => {
    expect(
      createCostTypeSchema.safeParse({ ...base, basis: "percentage", defaultValue: 50 }).success,
    ).toBe(true)
    expect(
      createCostTypeSchema.safeParse({ ...base, basis: "percentage", defaultValue: 101 }).success,
    ).toBe(false)
  })

  test("non-percentage default value just needs to be >= 0", () => {
    expect(createCostTypeSchema.safeParse({ ...base, defaultValue: 5000 }).success).toBe(true)
    expect(createCostTypeSchema.safeParse({ ...base, defaultValue: -1 }).success).toBe(false)
  })

  test("defaultValue defaults to 0 when omitted or empty", () => {
    const a = createCostTypeSchema.safeParse({
      name: "Cleaning",
      costCategoryId: UUID,
      basis: "flat",
      canBeOverridden: true,
      isActive: true,
    })
    expect(a.success).toBe(true)
    if (a.success) expect(a.data.defaultValue).toBe(0)
    const b = createCostTypeSchema.safeParse({ ...base, defaultValue: "" })
    expect(b.success).toBe(true)
    if (b.success) expect(b.data.defaultValue).toBe(0)
  })
})

describe("updateCostTypeSchema", () => {
  test("matches the create rules", () => {
    expect(updateCostTypeSchema.safeParse(base).success).toBe(true)
    expect(updateCostTypeSchema.safeParse({ ...base, name: "" }).success).toBe(false)
  })
})
