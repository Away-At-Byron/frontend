import { describe, expect, test } from "bun:test"
import {
  effectiveModules,
  toggleableModulesForRole,
  ROLE_DEFAULTS,
} from "../../../lib/modules"
import { createUserSchema, updateUserSchema } from "../schemas"

const managerDef = ROLE_DEFAULTS.manager ?? []

describe("effectiveModules", () => {
  test("admin gets everything", () => {
    const m = effectiveModules("admin", null)
    expect(m.has("users")).toBe(true)
    expect(m.has("dashboard")).toBe(true)
    expect(m.has("reports")).toBe(true)
  })

  const codes = (s: Set<string>) => [...s].map((c) => c as string).sort()

  // Data-driven against the editable ROLE_DEFAULTS map, so changing the
  // defaults doesn't break these behavioural guarantees.
  test("no override = role default + dashboard", () => {
    const expected = [...new Set([...managerDef, "dashboard"])].sort()
    expect(codes(effectiveModules("manager", null))).toEqual(expected)
    expect(effectiveModules("manager", null).has("users")).toBe(false)
  })

  test("per-user override keeps only the selected role-default modules", () => {
    const keep = managerDef.slice(0, 1)
    expect(codes(effectiveModules("manager", keep))).toEqual(
      [...new Set([...keep, "dashboard"])].sort(),
    )
  })

  test("explicit empty override = dashboard only", () => {
    expect(codes(effectiveModules("manager", []))).toEqual(["dashboard"])
  })

  test("a user can never gain a module outside its role default", () => {
    // `users` is admin-only and in no role default.
    const m = effectiveModules("staff", ["users"])
    expect(m.has("users")).toBe(false)
  })

  test("role with no defaults gets dashboard only", () => {
    expect(codes(effectiveModules("other", null))).toEqual(["dashboard"])
  })
})

describe("toggleableModulesForRole", () => {
  test("a role exposes exactly its (non-special) default modules", () => {
    expect(toggleableModulesForRole("manager").map((m) => m.code)).toEqual(
      managerDef,
    )
  })

  test("admin and empty roles expose nothing", () => {
    expect(toggleableModulesForRole("admin")).toEqual([])
    expect(toggleableModulesForRole("other")).toEqual([])
  })
})

describe("user schemas carry modules", () => {
  const base = {
    firstName: "Mary",
    lastName: "Renato",
    email: "Mary@Example.com",
    phone: "",
    roleId: "11111111-1111-1111-1111-111111111111",
  }

  test("createUserSchema defaults modules to []", () => {
    const r = createUserSchema.safeParse({ ...base, password: "supersecret" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.modules).toEqual([])
  })

  test("updateUserSchema accepts a modules array", () => {
    const r = updateUserSchema.safeParse({
      ...base,
      status: "active",
      modules: ["bookings", "contacts"],
    })
    expect(r.success).toBe(true)
  })
})
