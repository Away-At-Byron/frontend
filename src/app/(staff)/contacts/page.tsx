/**
 * Contacts (FRS §6.4) — unified people record (guests, staff links, contractors).
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import {
  listContacts,
  listPropertiesForContacts,
} from "@/modules/contacts/queries"
import { ContactManagement } from "@/modules/contacts/components/contact-management"

export default async function ContactsPage() {
  await assertModuleAccess("contacts")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const [contactsRes, propsRes] = await Promise.all([
    listContacts(),
    listPropertiesForContacts(),
  ])

  if (!contactsRes.ok || !propsRes.ok) {
    const message = !contactsRes.ok
      ? contactsRes.error.message
      : !propsRes.ok
        ? propsRes.error.message
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
      properties={propsRes.data}
      showPropertyPicker={session.user.propertyId === null}
    />
  )
}
