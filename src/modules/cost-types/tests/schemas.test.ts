import { describe, expect, test } from "bun:test"
import {
  createCostTypeSchema,
  updateCostTypeSchema,
} from "../schemas"

const base = {
  name: "OTA Commission",
  defaultRate: 50,
  canOverridden: true,
  isDeduction: true,
  isAddition: false,
}

describe("createCostTypeSchema", () => {
  test("accepts a valid row", () => {
    const res = createCostTypeSchema.safeParse(base)
    expect(res.success).toBe(true)
  })

  test("requires a name", () => {
    expect(createCostTypeSchema.safeParse({ ...base, name: "" }).success).toBe(false)
  })

  test("trims whitespace on name", () => {
    const res = createCostTypeSchema.safeParse({ ...base, name: "  OTA  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("OTA")
  })

  test("defaultRate defaults to 0 when omitted or empty", () => {
    const a = createCostTypeSchema.safeParse({
      name: "Cleaning",
      canOverridden: true,
      isAddition: true,
      isDeduction: false,
    })
    expect(a.success).toBe(true)
    if (a.success) expect(a.data.defaultRate).toBe(0)
    const b = createCostTypeSchema.safeParse({ ...base, defaultRate: "" })
    expect(b.success).toBe(true)
    if (b.success) expect(b.data.defaultRate).toBe(0)
  })

  test("rejects a negative rate", () => {
    expect(createCostTypeSchema.safeParse({ ...base, defaultRate: -1 }).success).toBe(false)
  })
})

describe("updateCostTypeSchema", () => {
  test("matches the create rules", () => {
    expect(updateCostTypeSchema.safeParse(base).success).toBe(true)
    expect(updateCostTypeSchema.safeParse({ ...base, name: "" }).success).toBe(false)
  })
})
