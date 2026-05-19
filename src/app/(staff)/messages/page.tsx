import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("messages")
  return <ModulePlaceholder title="Messages" frs="§6.24 Communication Log" stage="Stage 5 · Operations" />
}
