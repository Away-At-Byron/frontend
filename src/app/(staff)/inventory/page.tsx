import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { listInventoryItems } from "@/modules/inventory-items/queries"
import { InventoryManagement } from "@/modules/inventory-items/components/inventory-management"

export default async function InventoryPage() {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const res = await listInventoryItems()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load inventory. {res.error.message}
      </div>
    )
  }

  return <InventoryManagement initialItems={res.data} />
}
