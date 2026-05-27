import { describe, expect, test } from "bun:test"
import {
  createDiscountTypeSchema,
  deriveCode,
} from "../schemas"

const base = {
  name: "Summer 2026",
  code: "SUMMER2026",
  description: "",
  type: "percentage" as const,
  value: 25,
  maxDiscount: "",
  durationStart: "",
  durationEnd: "",
  activationMode: "duration" as const,
  minAmount: "",
  minNights: "",
  stackable: false,
}

describe("deriveCode", () => {
  test("strips spaces and punctuation, uppercases", () => {
    expect(deriveCode("Summer Sale 25")).toBe("SUMMERSALE25")
    expect(deriveCode("Early Bird!")).toBe("EARLYBIRD")
    expect(deriveCode("  Spring  ")).toBe("SPRING")
  })
  test("empty when no alphanumeric chars", () => {
    expect(deriveCode("--/--")).toBe("")
    expect(deriveCode("")).toBe("")
  })
})

describe("createDiscountTypeSchema", () => {
  test("accepts a valid percentage discount", () => {
    const res = createDiscountTypeSchema.safeParse(base)
    expect(res.success).toBe(true)
  })

  test("requires name and code", () => {
    expect(
      createDiscountTypeSchema.safeParse({ ...base, name: "" }).success,
    ).toBe(false)
    expect(
      createDiscountTypeSchema.safeParse({ ...base, code: "" }).success,
    ).toBe(false)
  })

  test("code must be uppercase alphanumeric only", () => {
    expect(
      createDiscountTypeSchema.safeParse({ ...base, code: "summer" }).success,
    ).toBe(false)
    expect(
      createDiscountTypeSchema.safeParse({ ...base, code: "SUMMER 25" })
        .success,
    ).toBe(false)
    expect(
      createDiscountTypeSchema.safeParse({ ...base, code: "SUMMER-25" })
        .success,
    ).toBe(false)
    expect(
      createDiscountTypeSchema.safeParse({ ...base, code: "SUMMER25" }).success,
    ).toBe(true)
  })

  test("percentage value must be 0-100", () => {
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        type: "percentage",
        value: 0,
      }).success,
    ).toBe(true)
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        type: "percentage",
        value: 100,
      }).success,
    ).toBe(true)
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        type: "percentage",
        value: 101,
      }).success,
    ).toBe(false)
  })

  test("flat / cashback value just needs to be >= 0", () => {
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        type: "flat",
        value: 1000,
      }).success,
    ).toBe(true)
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        type: "cashback",
        value: 50,
      }).success,
    ).toBe(true)
  })

  test("end date must be on or after start date", () => {
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        durationStart: "2026-06-01",
        durationEnd: "2026-05-31",
      }).success,
    ).toBe(false)
    expect(
      createDiscountTypeSchema.safeParse({
        ...base,
        durationStart: "2026-06-01",
        durationEnd: "2026-08-31",
      }).success,
    ).toBe(true)
  })

  test("min_nights: 0 or empty is normalised to null (no minimum)", () => {
    const a = createDiscountTypeSchema.safeParse({ ...base, minNights: 0 })
    expect(a.success).toBe(true)
    if (a.success) expect(a.data.minNights).toBe(null)
    const b = createDiscountTypeSchema.safeParse({ ...base, minNights: "" })
    expect(b.success).toBe(true)
    if (b.success) expect(b.data.minNights).toBe(null)
    const c = createDiscountTypeSchema.safeParse({ ...base, minNights: 3 })
    expect(c.success).toBe(true)
    if (c.success) expect(c.data.minNights).toBe(3)
  })

  test("empty string optional fields are treated as null", () => {
    const res = createDiscountTypeSchema.safeParse(base)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.description).toBe(null)
      expect(res.data.maxDiscount).toBe(null)
      expect(res.data.durationStart).toBe(null)
      expect(res.data.durationEnd).toBe(null)
      expect(res.data.minAmount).toBe(null)
      expect(res.data.minNights).toBe(null)
    }
  })
})
