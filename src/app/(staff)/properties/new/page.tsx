import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { assertModuleAccess } from "@/lib/access"
import { PropertyAdd } from "@/modules/properties/components/property-add"

export default async function PropertyAddPage() {
  await assertModuleAccess("setup")
  const session = await auth()
  if (!session?.user) redirect("/signin")

  return <PropertyAdd />
}
