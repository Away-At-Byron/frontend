/**
 * Settings > Room Configurations - admin-managed catalogue of detailed
 * room layout descriptions. Global, not tenanted (ADR-008).
 */
import { assertAdmin } from "@/lib/access"
import { listRoomConfigurations } from "@/modules/room-configurations/queries"
import { RoomConfigurationManagement } from "@/modules/room-configurations/components/room-configuration-management"

export default async function RoomConfigurationsPage() {
  await assertAdmin()

  const res = await listRoomConfigurations()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load room configurations. {res.error.message}
      </div>
    )
  }

  return <RoomConfigurationManagement initialConfigurations={res.data} />
}
