/**
 * Settings > Guest Types - admin-managed guest type catalogue.
 * Replaces the old guest_type enum on contacts (ADR-006 precedent).
 */
import { assertAdmin } from "@/lib/access"
import { listGuestTypes } from "@/modules/guest-types/queries"
import { GuestTypeManagement } from "@/modules/guest-types/components/guest-type-management"

export default async function GuestTypesPage() {
  await assertAdmin()

  const res = await listGuestTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load guest types. {res.error.message}
      </div>
    )
  }

  return <GuestTypeManagement initialTypes={res.data} />
}
