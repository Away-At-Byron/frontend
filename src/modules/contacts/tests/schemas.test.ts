import { describe, expect, test } from "bun:test"
import { createContactSchema } from "../schemas"

describe("createContactSchema", () => {
  test("requires first and last name", () => {
    const res = createContactSchema.safeParse({
      firstName: "",
      lastName: "Smith",
    })
    expect(res.success).toBe(false)
  })

  test("accepts a minimal contact", () => {
    const res = createContactSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      communicationPreference: "email",
    })
    expect(res.success).toBe(true)
  })

  test("accepts the new communication preference values", () => {
    for (const pref of ["both", "none", "unsubscribed"]) {
      const res = createContactSchema.safeParse({
        firstName: "Alex",
        lastName: "Rivera",
        communicationPreference: pref,
      })
      expect(res.success).toBe(true)
    }
  })

  test("accepts a valid MM-DD birthday and rejects a full date", () => {
    const ok = createContactSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      birthday: "11-21",
    })
    expect(ok.success).toBe(true)

    const bad = createContactSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      birthday: "1990-11-21",
    })
    expect(bad.success).toBe(false)
  })
})
