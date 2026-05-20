import { describe, expect, test } from "bun:test"
import { createContactSchema } from "../schemas"

describe("createContactSchema", () => {
  test("requires first and last name", () => {
    const res = createContactSchema.safeParse({
      firstName: "",
      lastName: "Smith",
      contactType: "guest",
    })
    expect(res.success).toBe(false)
  })

  test("accepts a minimal guest", () => {
    const res = createContactSchema.safeParse({
      firstName: "Alex",
      lastName: "Rivera",
      contactType: "guest",
      communicationPreference: "email",
      marketingOptIn: false,
      returningGuest: false,
      isVip: false,
    })
    expect(res.success).toBe(true)
  })
})
