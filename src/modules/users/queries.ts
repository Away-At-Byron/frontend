import "server-only"

import { and, eq, ne } from "drizzle-orm"
import { users, roles } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"

export type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  roleId: string
  roleName: string
  status: "active" | "disabled" | "locked"
}

export type RoleOption = { id: string; name: string }

/**
 * Users the caller may see. Admin (property_id = null) sees everyone;
 * a property-scoped caller sees only users in their property. Disabled
 * users are hidden (soft delete) — matches the old app's hard-delete UX.
 * Admin-only screen, enforced again at the page and in actions.
 */
export async function listUsers(): Promise<ActionResult<UserRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage users.")
    }
    const scope = ctx.propertyId
      ? and(eq(users.propertyId, ctx.propertyId), ne(users.status, "disabled"))
      : ne(users.status, "disabled")

    const rows = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        roleId: users.roleId,
        roleName: roles.name,
        status: users.status,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(scope)
      .orderBy(users.firstName)

    return ok(rows)
  })
}

export async function listRoles(): Promise<ActionResult<RoleOption[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage users.")
    }
    const rows = await tx
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .orderBy(roles.name)
    return ok(rows)
  })
}
