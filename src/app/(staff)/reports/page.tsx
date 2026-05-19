import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("reports")
  return <ModulePlaceholder title="Reports" frs="§6.26 Reports + Dashboard" stage="Stage 6 · Background + read" />
}
