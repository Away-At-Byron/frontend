import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import {
  getProperty,
  listAmenityCatalogue,
  listManagerOptions,
  listOwnerOptions,
  listPropertyAmenityIds,
} from "@/modules/properties/queries"
import { PropertyEdit } from "@/modules/properties/components/property-edit"

export default async function PropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const { id } = await params
  const [propertyRes, managersRes, ownersRes, catalogueRes, currentRes] =
    await Promise.all([
      getProperty(id),
      listManagerOptions(),
      listOwnerOptions(),
      listAmenityCatalogue(),
      listPropertyAmenityIds(id),
    ])

  if (!propertyRes.ok) {
    if (propertyRes.error.code === "NOT_FOUND") notFound()
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load property. {propertyRes.error.message}
      </div>
    )
  }

  return (
    <PropertyEdit
      property={propertyRes.data}
      managerOptions={managersRes.ok ? managersRes.data : []}
      ownerOptions={ownersRes.ok ? ownersRes.data : []}
      amenityCatalogue={catalogueRes.ok ? catalogueRes.data : []}
      initialAmenityIds={currentRes.ok ? currentRes.data : []}
    />
  )
}
