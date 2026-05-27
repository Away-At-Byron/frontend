/**
 * Settings > Room Amenities - admin-managed per-room amenity catalogue.
 * Global, follows ADR-007 precedent. Distinct from property_amenities.
 */
import { assertAdmin } from "@/lib/access"
import { listRoomAmenities } from "@/modules/room-amenities/queries"
import { RoomAmenityManagement } from "@/modules/room-amenities/components/room-amenity-management"

export default async function RoomAmenitiesPage() {
  await assertAdmin()

  const res = await listRoomAmenities()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load room amenities. {res.error.message}
      </div>
    )
  }

  return <RoomAmenityManagement initialAmenities={res.data} />
}
