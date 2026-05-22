import "server-only"

import { eq, inArray } from "drizzle-orm"
import { users, roles, userModuleAccess } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import { ROLE_NAMES } from "@/lib/modules"

export type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  roleId: string
  roleName: string
  status: "active" | "disabled"
  /** Per-user module override codes; null = no override (full role default). */
  moduleCodes: string[] | null
}

export type RoleOption = { id: string; name: string }

/**
 * Users the caller may see. Admin (property_id = null) sees everyone;
 * a property-scoped caller sees only users in their property. All
 * statuses are returned (active/disabled) so the screen can
 * filter by status. Admin-only, enforced again at the page and actions.
 */
export async function listUsers(): Promise<ActionResult<UserRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage users.")
    }
    const scope = ctx.propertyId
      ? eq(users.propertyId, ctx.propertyId)
      : undefined

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

    const ids = rows.map((r) => r.id)
    const access = ids.length
      ? await tx
          .select({
            userId: userModuleAccess.userId,
            moduleCode: userModuleAccess.moduleCode,
          })
          .from(userModuleAccess)
          .where(inArray(userModuleAccess.userId, ids))
      : []
    const byUser = new Map<string, string[]>()
    for (const a of access) {
      const list = byUser.get(a.userId) ?? []
      list.push(a.moduleCode)
      byUser.set(a.userId, list)
    }

    return ok(
      rows.map((r) => ({ ...r, moduleCodes: byUser.get(r.id) ?? null })),
    )
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

    // Canonical order (admin, manager, staff, …), not auto-sorted by name.
    // Unknown roles fall to the end, keeping their relative order.
    const order = ROLE_NAMES as readonly string[]
    const rank = (n: string) => {
      const i = order.indexOf(n)
      return i < 0 ? order.length : i
    }
    const sorted = [...rows].sort((a, b) => rank(a.name) - rank(b.name))
    return ok(sorted)
  })
}
