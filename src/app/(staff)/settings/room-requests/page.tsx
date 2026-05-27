/**
 * Settings > Room Requests - admin-managed catalogue of room requirements
 * a booking can be tagged with. Global, follows ADR-007.
 */
import { assertAdmin } from "@/lib/access"
import { listRoomRequests } from "@/modules/room-requests/queries"
import { RoomRequestManagement } from "@/modules/room-requests/components/room-request-management"

export default async function RoomRequestsPage() {
  await assertAdmin()

  const res = await listRoomRequests()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load room requests. {res.error.message}
      </div>
    )
  }

  return <RoomRequestManagement initialRequests={res.data} />
}
