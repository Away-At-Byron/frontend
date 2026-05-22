"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { users, roles, userModuleAccess, properties } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import { toggleableModulesForRole, OVERRIDE_NONE } from "@/lib/modules"
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "./schemas"
import type { UserRow } from "./queries"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage users.")
  }
  return null
}

/**
 * Map a submitted module selection to what we store and what we echo back.
 * `null` moduleCodes = "no override, follow role default". Selecting the
 * full toggleable set counts as no override; selecting none stores a
 * sentinel so it stays distinct from "never customised".
 */
function resolveModuleSelection(
  roleName: string,
  selected: string[],
): { rows: string[]; moduleCodes: string[] | null } {
  const toggleable = toggleableModulesForRole(roleName).map(
    (m) => m.code as string,
  )
  if (roleName === "admin" || toggleable.length === 0) {
    return { rows: [], moduleCodes: null }
  }
  const chosen = [...new Set(selected.filter((c) => toggleable.includes(c)))]
  if (chosen.length === toggleable.length) {
    return { rows: [], moduleCodes: null }
  }
  if (chosen.length === 0) {
    return { rows: [OVERRIDE_NONE], moduleCodes: [] }
  }
  return { rows: chosen, moduleCodes: chosen }
}

async function persistModules(
  tx: Tx,
  userId: string,
  rows: string[],
): Promise<void> {
  await tx
    .delete(userModuleAccess)
    .where(eq(userModuleAccess.userId, userId))
  if (rows.length) {
    await tx
      .insert(userModuleAccess)
      .values(rows.map((moduleCode) => ({ userId, moduleCode })))
  }
}

async function propertyNameOf(
  tx: Tx,
  propertyId: string | null,
): Promise<string | null> {
  if (!propertyId) return null
  const rows = await tx
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1)
  return rows[0]?.name ?? null
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "23505"
  )
}

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<UserRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createUserSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const data = parsed.data

    const role = await tx
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(eq(roles.id, data.roleId))
      .limit(1)
    if (!role[0]) {
      return err("VALIDATION", "That role no longer exists.", {
        roleId: ["Select a role"],
      })
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    try {
      const inserted = await tx
        .insert(users)
        .values({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
          passwordHash,
          roleId: data.roleId,
          propertyId: ctx.propertyId,
          status: "active",
        })
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          roleId: users.roleId,
          propertyId: users.propertyId,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })

      const { propertyId, ...row } = inserted[0]!
      const propertyName = await propertyNameOf(tx, propertyId)
      const sel = resolveModuleSelection(role[0].name, data.modules)
      await persistModules(tx, row.id, sel.rows)

      await writeAudit({
        ctx,
        entityType: "user",
        entityId: row.id,
        action: "create",
        newValue: {
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          roleId: row.roleId,
          modules: sel.moduleCodes,
        },
      })

      return ok({
        ...row,
        roleName: role[0].name,
        propertyName,
        moduleCodes: sel.moduleCodes,
      })
    } catch (e) {
      if (isUniqueViolation(e)) {
        return err("CONFLICT", "A user with that email already exists.", {
          email: ["Email already in use"],
        })
      }
      return err("INTERNAL", "Could not create the user.")
    }
  })
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<ActionResult<UserRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updateUserSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const data = parsed.data

    const existing = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        roleId: users.roleId,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!existing[0]) return err("NOT_FOUND", "That user no longer exists.")

    const role = await tx
      .select({ id: roles.id, name: roles.name })
      .from(roles)
      .where(eq(roles.id, data.roleId))
      .limit(1)
    if (!role[0]) {
      return err("VALIDATION", "That role no longer exists.", {
        roleId: ["Select a role"],
      })
    }

    try {
      const updated = await tx
        .update(users)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? null,
          roleId: data.roleId,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          roleId: users.roleId,
          propertyId: users.propertyId,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })

      const { propertyId, ...row } = updated[0]!
      const propertyName = await propertyNameOf(tx, propertyId)
      const sel = resolveModuleSelection(role[0].name, data.modules)
      await persistModules(tx, userId, sel.rows)

      await writeAudit({
        ctx,
        entityType: "user",
        entityId: row.id,
        action: "update",
        oldValue: existing[0],
        newValue: {
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          roleId: row.roleId,
          status: row.status,
          modules: sel.moduleCodes,
        },
      })

      return ok({
        ...row,
        roleName: role[0].name,
        propertyName,
        moduleCodes: sel.moduleCodes,
      })
    } catch (e) {
      if (isUniqueViolation(e)) {
        return err("CONFLICT", "A user with that email already exists.", {
          email: ["Email already in use"],
        })
      }
      return err("INTERNAL", "Could not update the user.")
    }
  })
}

/**
 * Soft delete: set status = 'disabled'. The list hides disabled users, so
 * the UX matches the old hard-delete (row disappears) while audit_log and
 * login history stay intact.
 */
export async function disableUser(
  userId: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    if (userId === ctx.userId) {
      return err("CONFLICT", "You cannot disable your own account.")
    }

    const existing = await tx
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!existing[0]) return err("NOT_FOUND", "That user no longer exists.")

    await tx
      .update(users)
      .set({ status: "disabled", updatedAt: new Date() })
      .where(eq(users.id, userId))

    await writeAudit({
      ctx,
      entityType: "user",
      entityId: userId,
      action: "status_change",
      oldValue: { status: existing[0].status },
      newValue: { status: "disabled" },
    })

    return ok({ id: userId })
  })
}
