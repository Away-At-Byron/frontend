"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { users, roles } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "./schemas"
import type { UserRow } from "./queries"

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage users.")
  }
  return null
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
          status: users.status,
        })

      const row = inserted[0]!
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
        },
      })

      return ok({ ...row, roleName: role[0].name })
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
          status: users.status,
        })

      const row = updated[0]!
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
        },
      })

      return ok({ ...row, roleName: role[0].name })
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
