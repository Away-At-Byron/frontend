import { describe, expect, test } from "bun:test"
import {
  createPropertyAmenitySchema,
  updatePropertyAmenitySchema,
} from "../schemas"

describe("createPropertyAmenitySchema", () => {
  test("requires category and name", () => {
    expect(
      createPropertyAmenitySchema.safeParse({ category: "", name: "WiFi" })
        .success,
    ).toBe(false)
    expect(
      createPropertyAmenitySchema.safeParse({
        category: "Connectivity",
        name: "",
      }).success,
    ).toBe(false)
    expect(createPropertyAmenitySchema.safeParse({}).success).toBe(false)
  })

  test("trims surrounding whitespace", () => {
    const res = createPropertyAmenitySchema.safeParse({
      category: "  Kitchen  ",
      name: "  Microwave  ",
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.category).toBe("Kitchen")
      expect(res.data.name).toBe("Microwave")
    }
  })

  test("rejects a category over 50 characters", () => {
    expect(
      createPropertyAmenitySchema.safeParse({
        category: "x".repeat(51),
        name: "WiFi",
      }).success,
    ).toBe(false)
  })

  test("rejects a name over 80 characters", () => {
    expect(
      createPropertyAmenitySchema.safeParse({
        category: "Connectivity",
        name: "x".repeat(81),
      }).success,
    ).toBe(false)
  })

  test("does not accept a sortOrder field", () => {
    // sortOrder is derived on the server; the modal does not expose it.
    // Schema should drop unknown keys by default.
    const res = createPropertyAmenitySchema.safeParse({
      category: "Connectivity",
      name: "WiFi",
      sortOrder: 7,
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect("sortOrder" in res.data).toBe(false)
    }
  })
})

describe("updatePropertyAmenitySchema", () => {
  test("matches the create rules", () => {
    expect(
      updatePropertyAmenitySchema.safeParse({
        category: "Kitchen",
        name: "Oven",
      }).success,
    ).toBe(true)
    expect(
      updatePropertyAmenitySchema.safeParse({ category: "", name: "Oven" })
        .success,
    ).toBe(false)
  })
})
