import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { listProperties } from "@/modules/properties/queries"
import { PropertyManagement } from "@/modules/properties/components/property-management"

export default async function PropertiesPage() {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const res = await listProperties()
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load properties. {res.error.message}
      </div>
    )
  }

  return <PropertyManagement initialProperties={res.data} />
}
