/**
 * Settings > Contact Types — admin-managed contact type catalogue.
 * Editable here so the list keeps up without a migration (ADR-006 / the
 * `contact_types` schema replaces the old `contact_type` enum).
 */
import { assertAdmin } from "@/lib/access"
import { listContactTypes } from "@/modules/contact-types/queries"
import { ContactTypeManagement } from "@/modules/contact-types/components/contact-type-management"

export default async function ContactTypesPage() {
  // Admin-only screen (mirrors the Users page guard).
  await assertAdmin()

  const res = await listContactTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load contact types. {res.error.message}
      </div>
    )
  }

  return <ContactTypeManagement initialTypes={res.data} />
}
