/**
 * Contacts (FRS §6.4) — unified people record. Global, not property-scoped
 * (ADR-006).
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { hasPermission } from "@/lib/permissions"
import {
  listContacts,
  listContactSources,
  listContactTypes,
  listGroupOptions,
} from "@/modules/contacts/queries"
import { CONTACT_PERMISSIONS } from "@/modules/contacts/permissions"
import { ContactManagement } from "@/modules/contacts/components/contact-management"

export default async function ContactsPage() {
  await assertModuleAccess("contacts")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const [contactsRes, typesRes, sourcesRes, groupsRes] = await Promise.all([
    listContacts(),
    listContactTypes(),
    listContactSources(),
    listGroupOptions(),
  ])

  if (!contactsRes.ok || !typesRes.ok || !sourcesRes.ok || !groupsRes.ok) {
    const message = !contactsRes.ok
      ? contactsRes.error.message
      : !typesRes.ok
        ? typesRes.error.message
        : !sourcesRes.ok
          ? sourcesRes.error.message
          : !groupsRes.ok
            ? groupsRes.error.message
            : ""
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load contacts. {message}
      </div>
    )
  }

  return (
    <ContactManagement
      initialContacts={contactsRes.data}
      contactTypes={typesRes.data}
      contactSources={sourcesRes.data}
      groups={groupsRes.data}
      canDelete={hasPermission(session.user.role, CONTACT_PERMISSIONS.delete)}
    />
  )
}
