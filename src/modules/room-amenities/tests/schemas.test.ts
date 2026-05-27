import { describe, expect, test } from "bun:test"
import { createRoomAmenitySchema, updateRoomAmenitySchema } from "../schemas"

describe("createRoomAmenitySchema", () => {
  test("requires a name", () => {
    expect(createRoomAmenitySchema.safeParse({ name: "" }).success).toBe(false)
    expect(createRoomAmenitySchema.safeParse({}).success).toBe(false)
  })

  test("trims whitespace", () => {
    const res = createRoomAmenitySchema.safeParse({ name: "  Smart TV  " })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Smart TV")
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createRoomAmenitySchema.safeParse({ name: "x".repeat(81) }).success,
    ).toBe(false)
  })

  test("accepts a valid name", () => {
    expect(
      createRoomAmenitySchema.safeParse({ name: "Air Conditioning" }).success,
    ).toBe(true)
  })
})

describe("updateRoomAmenitySchema", () => {
  test("matches the create rules", () => {
    expect(updateRoomAmenitySchema.safeParse({ name: "Balcony" }).success).toBe(
      true,
    )
    expect(updateRoomAmenitySchema.safeParse({ name: "" }).success).toBe(false)
  })
})
