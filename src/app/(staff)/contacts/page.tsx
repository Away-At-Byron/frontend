import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("contacts")
  return <ModulePlaceholder title="Guests" frs="§6.4 Contacts" stage="Stage 2 · Reference data" />
}
