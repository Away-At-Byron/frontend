import { describe, expect, test } from "bun:test"
import { createTariffPlanSchema, deriveCode } from "../schemas"

const UUID_A = "11111111-1111-1111-1111-111111111111"
const UUID_B = "22222222-2222-2222-2222-222222222222"
const UUID_C = "33333333-3333-3333-3333-333333333333"

const base = {
  name: "Cottage Weekday",
  code: "COTTAGEWEEKDAY",
  tariffBeginningPriceId: UUID_A,
  propertyId: UUID_B,
  roomTypeId: UUID_C,
  status: "active" as const,
}

describe("deriveCode", () => {
  test("strips non-alphanumeric and uppercases", () => {
    expect(deriveCode("Cottage Weekday")).toBe("COTTAGEWEEKDAY")
    expect(deriveCode("Non-Refundable!")).toBe("NONREFUNDABLE")
  })
})

describe("createTariffPlanSchema", () => {
  test("accepts a valid row", () => {
    expect(createTariffPlanSchema.safeParse(base).success).toBe(true)
  })

  test("requires name and code", () => {
    expect(createTariffPlanSchema.safeParse({ ...base, name: "" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, code: "" }).success).toBe(false)
  })

  test("code must be uppercase alphanumeric only", () => {
    expect(createTariffPlanSchema.safeParse({ ...base, code: "cottage" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, code: "COTTAGE WEEKDAY" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, code: "COTTAGE-1" }).success).toBe(false)
  })

  test("FK fields must be valid UUIDs", () => {
    expect(createTariffPlanSchema.safeParse({ ...base, tariffBeginningPriceId: "" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, propertyId: "not-a-uuid" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, roomTypeId: "" }).success).toBe(false)
  })

  test("status must be active or inactive", () => {
    expect(createTariffPlanSchema.safeParse({ ...base, status: "draft" }).success).toBe(false)
    expect(createTariffPlanSchema.safeParse({ ...base, status: "inactive" }).success).toBe(true)
  })
})
