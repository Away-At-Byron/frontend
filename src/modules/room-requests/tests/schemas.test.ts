import { describe, expect, test } from "bun:test"
import {
  createRoomRequestSchema,
  updateRoomRequestSchema,
} from "../schemas"

describe("createRoomRequestSchema", () => {
  test("requires a name", () => {
    expect(createRoomRequestSchema.safeParse({ name: "" }).success).toBe(false)
    expect(createRoomRequestSchema.safeParse({}).success).toBe(false)
  })

  test("trims whitespace on name", () => {
    const res = createRoomRequestSchema.safeParse({
      name: "  Late Arrival  ",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.name).toBe("Late Arrival")
  })

  test("accepts a row with no code", () => {
    const res = createRoomRequestSchema.safeParse({ name: "Late Arrival" })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.code).toBe(null)
  })

  test("empty code is normalised to null", () => {
    const res = createRoomRequestSchema.safeParse({
      name: "Late Arrival",
      code: "",
    })
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.code).toBe(null)
  })

  test("code must be uppercase alphanumeric only", () => {
    expect(
      createRoomRequestSchema.safeParse({ name: "Late Arrival", code: "late" })
        .success,
    ).toBe(false)
    expect(
      createRoomRequestSchema.safeParse({
        name: "Late Arrival",
        code: "LATE 1",
      }).success,
    ).toBe(false)
    expect(
      createRoomRequestSchema.safeParse({ name: "Late Arrival", code: "LATE1" })
        .success,
    ).toBe(true)
  })

  test("rejects a name over 100 characters", () => {
    expect(
      createRoomRequestSchema.safeParse({ name: "x".repeat(101) }).success,
    ).toBe(false)
  })
})

describe("updateRoomRequestSchema", () => {
  test("matches the create rules", () => {
    expect(
      updateRoomRequestSchema.safeParse({
        name: "Extra Bed",
        code: "EB",
      }).success,
    ).toBe(true)
    expect(
      updateRoomRequestSchema.safeParse({ name: "", code: "EB" }).success,
    ).toBe(false)
  })
})
