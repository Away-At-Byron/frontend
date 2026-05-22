import { describe, expect, test } from "bun:test"
import { createUserSchema, updateUserSchema } from "../schemas"

const base = {
  firstName: "Mary",
  lastName: "Renato",
  email: "Mary@Example.com",
  phone: "0400 000 000",
  roleId: "11111111-1111-1111-1111-111111111111",
}
const valid = { ...base, password: "supersecret" }

describe("createUserSchema", () => {
  test("accepts a valid user and lowercases the email", () => {
    const r = createUserSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe("mary@example.com")
  })

  test("rejects a password under 8 chars", () => {
    expect(createUserSchema.safeParse({ ...valid, password: "short" }).success).toBe(false)
  })

  test("rejects an invalid email", () => {
    expect(createUserSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false)
  })

  test("rejects an empty name", () => {
    expect(createUserSchema.safeParse({ ...valid, firstName: "  " }).success).toBe(false)
  })

  test("rejects a non-uuid roleId", () => {
    expect(createUserSchema.safeParse({ ...valid, roleId: "admin" }).success).toBe(false)
  })

  test("optional phone becomes undefined when blank", () => {
    const r = createUserSchema.safeParse({ ...valid, phone: "" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBeUndefined()
  })
})

describe("updateUserSchema", () => {
  test("accepts a valid status", () => {
    expect(updateUserSchema.safeParse({ ...base, status: "disabled" }).success).toBe(true)
  })

  test("rejects an unknown status", () => {
    expect(updateUserSchema.safeParse({ ...base, status: "locked" }).success).toBe(false)
  })
})
