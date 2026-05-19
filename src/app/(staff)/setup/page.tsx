import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("setup")
  return <ModulePlaceholder title="Setup" frs="§6.2–6.13 Property + reference data" stage="Stage 1–2 · Foundation + reference" />
}
