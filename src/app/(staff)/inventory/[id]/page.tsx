import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import {
  getInventoryItem,
  listSupplierOptions,
} from "@/modules/inventory-items/queries"
import { listStorageLocationOptions } from "@/modules/storage-locations/queries"
import { InventoryEdit } from "@/modules/inventory-items/components/inventory-edit"

export default async function InventoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const { id } = await params
  const [itemRes, suppliersRes, locationsRes] = await Promise.all([
    getInventoryItem(id),
    listSupplierOptions(),
    listStorageLocationOptions(),
  ])

  if (!itemRes.ok) {
    if (itemRes.error.code === "NOT_FOUND") notFound()
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load item. {itemRes.error.message}
      </div>
    )
  }
  if (!suppliersRes.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load suppliers. {suppliersRes.error.message}
      </div>
    )
  }
  if (!locationsRes.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load storage locations. {locationsRes.error.message}
      </div>
    )
  }

  return (
    <InventoryEdit
      item={itemRes.data.item}
      suppliers={suppliersRes.data}
      storageLocations={locationsRes.data}
      storageAllocations={itemRes.data.storageAllocations}
      initialPhotoUrl={itemRes.data.photoUrl}
    />
  )
}
