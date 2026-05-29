/**
 * Settings > Storage Locations — admin-managed catalogue of places where
 * inventory is kept (Linen room, Garage, Cellar, etc.). Each inventory
 * item can be allocated across multiple storage locations with a qty per
 * pair (see inventory_item_storage_assignments).
 */
import { assertAdmin } from "@/lib/access"
import { listStorageLocations } from "@/modules/storage-locations/queries"
import { StorageLocationManagement } from "@/modules/storage-locations/components/storage-location-management"

export default async function StorageLocationsPage() {
  await assertAdmin()

  const res = await listStorageLocations()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load storage locations. {res.error.message}
      </div>
    )
  }

  return <StorageLocationManagement initialLocations={res.data} />
}
