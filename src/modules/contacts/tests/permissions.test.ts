import { describe, expect, test } from "bun:test"
import { hasPermission } from "../../../lib/permissions"
import { CONTACT_PERMISSIONS } from "../permissions"

// Guards the role grants behind the Contacts table Delete button. Deletion is
// soft (flips is_deleted) but still management-only.
describe("contact.delete permission", () => {
  test("admin and manager can delete contacts", () => {
    expect(hasPermission("admin", CONTACT_PERMISSIONS.delete)).toBe(true)
    expect(hasPermission("manager", CONTACT_PERMISSIONS.delete)).toBe(true)
  })

  test("staff, front_desk and other cannot delete contacts", () => {
    expect(hasPermission("staff", CONTACT_PERMISSIONS.delete)).toBe(false)
    expect(hasPermission("front_desk", CONTACT_PERMISSIONS.delete)).toBe(false)
    expect(hasPermission("other", CONTACT_PERMISSIONS.delete)).toBe(false)
  })

  test("delete-capable roles still hold read, create and update", () => {
    for (const role of ["admin", "manager"] as const) {
      expect(hasPermission(role, CONTACT_PERMISSIONS.read)).toBe(true)
      expect(hasPermission(role, CONTACT_PERMISSIONS.create)).toBe(true)
      expect(hasPermission(role, CONTACT_PERMISSIONS.update)).toBe(true)
    }
  })
})
