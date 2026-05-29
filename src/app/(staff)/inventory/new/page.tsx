import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { listSupplierOptions } from "@/modules/inventory-items/queries"
import { listStorageLocationOptions } from "@/modules/storage-locations/queries"
import { InventoryEdit } from "@/modules/inventory-items/components/inventory-edit"
import type { InventoryItemType } from "@/modules/inventory-items/types"

const VALID_TYPES: InventoryItemType[] = ["asset", "inventory", "consumable"]

export default async function NewInventoryItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const { type } = await searchParams
  const defaultType = (VALID_TYPES as string[]).includes(type ?? "")
    ? (type as InventoryItemType)
    : "asset"

  const [suppliers, locations] = await Promise.all([
    listSupplierOptions(),
    listStorageLocationOptions(),
  ])
  if (!suppliers.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load suppliers. {suppliers.error.message}
      </div>
    )
  }
  if (!locations.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load storage locations. {locations.error.message}
      </div>
    )
  }

  return (
    <InventoryEdit
      item={null}
      suppliers={suppliers.data}
      storageLocations={locations.data}
      defaultType={defaultType}
    />
  )
}
