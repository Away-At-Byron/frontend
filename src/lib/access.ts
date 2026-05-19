import "server-only"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { userModuleAccess } from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  NAV_ENTRIES,
  effectiveModules,
  type ModuleCode,
  type NavEntry,
} from "@/lib/modules"

/**
 * The per-user override codes, or `null` when the user has no override
 * (=> full role default). Admin never has rows and is resolved as full.
 */
export async function getUserModuleCodes(
  userId: string,
): Promise<string[] | null> {
  const rows = await db
    .select({ moduleCode: userModuleAccess.moduleCode })
    .from(userModuleAccess)
    .where(eq(userModuleAccess.userId, userId))
  return rows.length ? rows.map((r) => r.moduleCode) : null
}

/**
 * Effective modules for the signed-in user: role static default,
 * intersected with the per-user override when one exists (ADR-003).
 */
export async function getAllowedModules(
  userId: string,
  roleName: string,
): Promise<Set<ModuleCode>> {
  if (roleName === "admin") return effectiveModules("admin", null)
  const codes = await getUserModuleCodes(userId)
  return effectiveModules(roleName, codes)
}

/** Nav entries this user may see (admin-only entries require admin). */
export function visibleNav(
  roleName: string,
  allowed: Set<ModuleCode>,
): NavEntry[] {
  const isAdmin = roleName === "admin"
  return NAV_ENTRIES.filter((n) =>
    n.adminOnly ? isAdmin : allowed.has(n.module),
  )
}

/**
 * Page guard: redirect to the dashboard if the signed-in user can't reach
 * `module`. Call at the top of a (staff) page's server component.
 */
export async function assertModuleAccess(module: ModuleCode): Promise<void> {
  const session = await auth()
  if (!session?.user) redirect("/signin")
  if (session.user.role === "admin") return
  const allowed = await getAllowedModules(session.user.id, session.user.role)
  if (!allowed.has(module)) redirect("/home")
}

/** Page guard for admin-only screens (Users). */
export async function assertAdmin(): Promise<void> {
  const session = await auth()
  if (!session?.user) redirect("/signin")
  if (session.user.role !== "admin") redirect("/home")
}
