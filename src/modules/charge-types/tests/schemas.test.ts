import { describe, expect, test } from "bun:test"
import {
  createChargeTypeSchema,
  updateChargeTypeSchema,
} from "../schemas"

describe("createChargeTypeSchema", () => {
  test("requires a name", () => {
    expect(createChargeTypeSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createChargeTypeSchema.safeParse({}).success).toBe(false)
  })

  test("trims whitespace on name", () => {
    const res = createChargeTypeSchema.safeParse({ name: "  Bond  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Bond")
  })

  test("rejects a name over 100 characters", () => {
    expect(
      createChargeTypeSchema.safeParse({ name: "x".repeat(101) }).success,
    ).toBe(false)
  })

  test("amount defaults to 0 when omitted or empty", () => {
    const a = createChargeTypeSchema.safeParse({ name: "Cleaning Fee" })
    expect(a.success).toBe(true)
    if (a.success) expect(a.data.amount).toBe(0)
    const b = createChargeTypeSchema.safeParse({
      name: "Cleaning Fee",
      amount: "",
    })
    expect(b.success).toBe(true)
    if (b.success) expect(b.data.amount).toBe(0)
  })

  test("coerces a decimal amount", () => {
    const res = createChargeTypeSchema.safeParse({
      name: "Bond",
      amount: 1500.5,
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.amount).toBe(1500.5)
  })

  test("rejects a negative amount", () => {
    expect(
      createChargeTypeSchema.safeParse({ name: "Bond", amount: -5 }).success,
    ).toBe(false)
  })
})

describe("updateChargeTypeSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateChargeTypeSchema.safeParse({ name: "Bond", amount: 1500 })
        .success,
    ).toBe(true)
    expect(
      updateChargeTypeSchema.safeParse({ name: "", amount: 1500 }).success,
    ).toBe(false)
  })
})
