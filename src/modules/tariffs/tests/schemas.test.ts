import { describe, expect, test } from "bun:test"
import {
  createTariffSchema,
  deriveCode,
  updateTariffSchema,
} from "../schemas"

const base = {
  name: "Weekend Escape",
  code: "WEEKENDESCAPE",
  tariffBasis: "per_night" as const,
  refundable: true,
  breakfastIncluded: false,
  traffic: "direct" as const,
  status: "active" as const,
  propertyId: null,
  roomId: null,
  tariffPeriodId: null,
}

describe("deriveCode", () => {
  test("strips non-alphanumerics and uppercases", () => {
    expect(deriveCode("Weekend Escape!")).toBe("WEEKENDESCAPE")
    expect(deriveCode("  long-stay 30 ")).toBe("LONGSTAY30")
  })
})

describe("createTariffSchema", () => {
  test("accepts a full valid row", () => {
    expect(createTariffSchema.safeParse(base).success).toBe(true)
  })

  test("requires a name", () => {
    expect(
      createTariffSchema.safeParse({ ...base, name: "" }).success,
    ).toBe(false)
  })

  test("trims name whitespace", () => {
    const res = createTariffSchema.safeParse({
      ...base,
      name: "  Weekend Rate  ",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Weekend Rate")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createTariffSchema.safeParse({ ...base, name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("requires a code with allowed characters only", () => {
    expect(
      createTariffSchema.safeParse({ ...base, code: "weekend escape" }).success,
    ).toBe(false)
    expect(
      createTariffSchema.safeParse({ ...base, code: "WEEK-END" }).success,
    ).toBe(false)
  })

  test("accepts every valid tariff basis", () => {
    for (const tariffBasis of ["per_night", "per_week", "long_stay"] as const) {
      expect(
        createTariffSchema.safeParse({ ...base, tariffBasis }).success,
      ).toBe(true)
    }
  })

  test("rejects an unknown tariff basis", () => {
    expect(
      createTariffSchema.safeParse({ ...base, tariffBasis: "hourly" }).success,
    ).toBe(false)
  })

  test("accepts every valid traffic value", () => {
    for (const traffic of ["ota", "direct", "other"] as const) {
      expect(
        createTariffSchema.safeParse({ ...base, traffic }).success,
      ).toBe(true)
    }
  })

  test("rejects an unknown traffic value", () => {
    expect(
      createTariffSchema.safeParse({ ...base, traffic: "agoda" }).success,
    ).toBe(false)
  })

  test("accepts both status values", () => {
    for (const status of ["active", "inactive"] as const) {
      expect(createTariffSchema.safeParse({ ...base, status }).success).toBe(
        true,
      )
    }
  })

  test("treats an empty propertyId/roomId/tariffPeriodId string as null", () => {
    const res = createTariffSchema.safeParse({
      ...base,
      propertyId: "",
      roomId: "",
      tariffPeriodId: "",
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.propertyId).toBeNull()
      expect(res.data.roomId).toBeNull()
      expect(res.data.tariffPeriodId).toBeNull()
    }
  })

  test("accepts a valid uuid tariffPeriodId", () => {
    const id = "22222222-2222-2222-2222-222222222222"
    const res = createTariffSchema.safeParse({ ...base, tariffPeriodId: id })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.tariffPeriodId).toBe(id)
  })

  test("rejects a non-uuid tariffPeriodId", () => {
    expect(
      createTariffSchema.safeParse({ ...base, tariffPeriodId: "nope" }).success,
    ).toBe(false)
  })

  test("rejects a non-uuid propertyId", () => {
    expect(
      createTariffSchema.safeParse({ ...base, propertyId: "not-a-uuid" })
        .success,
    ).toBe(false)
  })

  test("accepts a valid uuid propertyId and roomId", () => {
    const id = "11111111-1111-1111-1111-111111111111"
    const res = createTariffSchema.safeParse({
      ...base,
      propertyId: id,
      roomId: id,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.propertyId).toBe(id)
      expect(res.data.roomId).toBe(id)
    }
  })

  test("requires refundable and breakfastIncluded as booleans", () => {
    expect(
      createTariffSchema.safeParse({ ...base, refundable: "yes" }).success,
    ).toBe(false)
    expect(
      createTariffSchema.safeParse({ ...base, breakfastIncluded: 1 }).success,
    ).toBe(false)
  })
})

describe("updateTariffSchema", () => {
  test("matches the create rules", () => {
    expect(updateTariffSchema.safeParse(base).success).toBe(true)
    expect(
      updateTariffSchema.safeParse({ ...base, name: "" }).success,
    ).toBe(false)
  })
})
