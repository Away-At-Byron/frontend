/**
 * Contacts (FRS §6.4) — unified people record. Global, not property-scoped
 * (ADR-006).
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { listContacts, listContactTypes } from "@/modules/contacts/queries"
import { ContactManagement } from "@/modules/contacts/components/contact-management"

export default async function ContactsPage() {
  await assertModuleAccess("contacts")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const [contactsRes, typesRes] = await Promise.all([
    listContacts(),
    listContactTypes(),
  ])

  if (!contactsRes.ok || !typesRes.ok) {
    const message = !contactsRes.ok
      ? contactsRes.error.message
      : !typesRes.ok
        ? typesRes.error.message
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
    />
  )
}
