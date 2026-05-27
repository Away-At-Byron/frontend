import { describe, expect, test } from "bun:test"
import {
  createRoomConfigurationSchema,
  updateRoomConfigurationSchema,
} from "../schemas"

describe("createRoomConfigurationSchema", () => {
  test("requires a name", () => {
    expect(
      createRoomConfigurationSchema.safeParse({ name: "" }).success,
    ).toBe(false)
    expect(createRoomConfigurationSchema.safeParse({}).success).toBe(false)
  })

  test("trims surrounding whitespace", () => {
    const res = createRoomConfigurationSchema.safeParse({
      name: "  King Ensuite  ",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("King Ensuite")
  })

  test("accepts long layout strings up to 120 chars", () => {
    expect(
      createRoomConfigurationSchema.safeParse({
        name: "2 King Rooms, Queen Room, 2 Singles / 1 King, 2 Bathrooms",
      }).success,
    ).toBe(true)
  })

  test("rejects a name over 120 characters", () => {
    expect(
      createRoomConfigurationSchema.safeParse({ name: "x".repeat(121) })
        .success,
    ).toBe(false)
  })

  test("treats empty-string occupancy as null", () => {
    const res = createRoomConfigurationSchema.safeParse({
      name: "Studio",
      defaultMaxOccupancy: "",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.defaultMaxOccupancy).toBe(null)
  })

  test("coerces a numeric occupancy", () => {
    const res = createRoomConfigurationSchema.safeParse({
      name: "Apartment",
      defaultMaxOccupancy: 4,
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.defaultMaxOccupancy).toBe(4)
  })

  test("rejects an occupancy above 32", () => {
    expect(
      createRoomConfigurationSchema.safeParse({
        name: "Villa",
        defaultMaxOccupancy: 33,
      }).success,
    ).toBe(false)
  })
})

describe("updateRoomConfigurationSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateRoomConfigurationSchema.safeParse({
        name: "Queen Ensuite",
        defaultMaxOccupancy: 2,
      }).success,
    ).toBe(true)
  })
})
