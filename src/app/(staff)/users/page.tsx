/**
 * Users + Roles (FRS §6.3) — admin-only management screen.
 * CRUD behaviour ported from documentation/02-user-crud.md; the look is
 * this system's Editorial Sunrise primitives.
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { listUsers, listRoles } from "@/modules/users/queries"
import { UserManagement } from "@/modules/users/components/user-management"

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/signin")
  // Only an admin can see this page.
  if (session.user.role !== "admin") redirect("/home")

  const [usersRes, rolesRes] = await Promise.all([listUsers(), listRoles()])

  if (!usersRes.ok || !rolesRes.ok) {
    const message = !usersRes.ok ? usersRes.error.message : !rolesRes.ok ? rolesRes.error.message : ""
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load users. {message}
      </div>
    )
  }

  return (
    <UserManagement
      initialUsers={usersRes.data}
      roles={rolesRes.data}
      currentUserId={session.user.id}
    />
  )
}
