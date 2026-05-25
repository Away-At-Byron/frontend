/**
 * Contacts > Group Management (FRS §6.4). Group bookings tie a primary
 * contact to related members.
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { hasPermission } from "@/lib/permissions"
import { listGroups } from "@/modules/contacts/queries"
import { CONTACT_PERMISSIONS } from "@/modules/contacts/permissions"
import { GroupManagement } from "@/modules/contacts/components/group-management"

export default async function GroupsPage() {
  await assertModuleAccess("contacts")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const res = await listGroups()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load groups. {res.error.message}
      </div>
    )
  }

  return (
    <GroupManagement
      initialGroups={res.data}
      canDelete={hasPermission(session.user.role, CONTACT_PERMISSIONS.delete)}
    />
  )
}
