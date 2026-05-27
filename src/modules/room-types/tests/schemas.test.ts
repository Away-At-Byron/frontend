import { describe, expect, test } from "bun:test"
import { createRoomTypeSchema, updateRoomTypeSchema } from "../schemas"

describe("createRoomTypeSchema", () => {
  test("requires a name", () => {
    expect(createRoomTypeSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createRoomTypeSchema.safeParse({}).success).toBe(false)
  })

  test("rejects a whitespace-only name", () => {
    expect(
      createRoomTypeSchema.safeParse({ name: "   " }).success,
    ).toBe(false)
  })

  test("trims surrounding whitespace", () => {
    const res = createRoomTypeSchema.safeParse({ name: "  Cottage  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Cottage")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createRoomTypeSchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name with no occupancy", () => {
    const res = createRoomTypeSchema.safeParse({ name: "Studio" })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.defaultMaxOccupancy).toBe(null)
  })

  test("coerces a numeric occupancy", () => {
    const res = createRoomTypeSchema.safeParse({
      name: "Apartment",
      defaultMaxOccupancy: 4,
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.defaultMaxOccupancy).toBe(4)
  })

  test("treats empty-string occupancy as null", () => {
    const res = createRoomTypeSchema.safeParse({
      name: "Studio",
      defaultMaxOccupancy: "",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.defaultMaxOccupancy).toBe(null)
  })

  test("rejects an occupancy below 1", () => {
    expect(
      createRoomTypeSchema.safeParse({
        name: "Studio",
        defaultMaxOccupancy: 0,
      }).success,
    ).toBe(false)
  })

  test("rejects an occupancy above 32", () => {
    expect(
      createRoomTypeSchema.safeParse({
        name: "Studio",
        defaultMaxOccupancy: 33,
      }).success,
    ).toBe(false)
  })

  test("rejects a non-integer occupancy", () => {
    expect(
      createRoomTypeSchema.safeParse({
        name: "Studio",
        defaultMaxOccupancy: 2.5,
      }).success,
    ).toBe(false)
  })
})

describe("updateRoomTypeSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateRoomTypeSchema.safeParse({ name: "Villa", defaultMaxOccupancy: 6 })
        .success,
    ).toBe(true)
    expect(updateRoomTypeSchema.safeParse({ name: "" }).success).toBe(false)
  })
})
