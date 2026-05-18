import { describe, expect, test } from "bun:test"
import { createExampleSchema } from "../schemas"

// Acceptance criteria from the FRS become test cases (CLAUDE.md rule 8).
describe("example schema", () => {
  test("rejects empty name", () => {
    expect(createExampleSchema.safeParse({ name: "", priceCents: 0 }).success).toBe(false)
  })
  test("rejects non-integer cents", () => {
    expect(createExampleSchema.safeParse({ name: "Ok", priceCents: 9.99 }).success).toBe(false)
  })
  test("accepts a valid row", () => {
    expect(createExampleSchema.safeParse({ name: "Turnover clean", priceCents: 4500 }).success).toBe(true)
  })
})
