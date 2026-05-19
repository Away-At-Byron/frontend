import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("bookings")
  return <ModulePlaceholder title="New booking" frs="§6.15 Quote + §6.16 Bookings" stage="Stage 3 · Booking core" />
}
