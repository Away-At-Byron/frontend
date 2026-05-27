/**
 * Settings > Room Types - admin-managed room type catalogue.
 * Global, not tenanted (ADR-007). Mirrors contact_types / contact_sources.
 */
import { assertAdmin } from "@/lib/access"
import { listRoomTypes } from "@/modules/room-types/queries"
import { RoomTypeManagement } from "@/modules/room-types/components/room-type-management"

export default async function RoomTypesPage() {
  await assertAdmin()

  const res = await listRoomTypes()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load room types. {res.error.message}
      </div>
    )
  }

  return <RoomTypeManagement initialTypes={res.data} />
}
