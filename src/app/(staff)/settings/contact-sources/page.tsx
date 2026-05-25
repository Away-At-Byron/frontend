/**
 * Settings > Contact Sources — admin-managed contact source catalogue.
 * Editable here so the list keeps up without a migration (mirrors the
 * contact_types pattern; the `contact_sources` schema replaces the old
 * `contact_source` enum on contacts).
 */
import { assertAdmin } from "@/lib/access"
import { listContactSources } from "@/modules/contact-sources/queries"
import { ContactSourceManagement } from "@/modules/contact-sources/components/contact-source-management"

export default async function ContactSourcesPage() {
  // Admin-only screen (mirrors the Contact Types page guard).
  await assertAdmin()

  const res = await listContactSources()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load contact sources. {res.error.message}
      </div>
    )
  }

  return <ContactSourceManagement initialSources={res.data} />
}
