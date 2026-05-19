import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("calendar")
  return <ModulePlaceholder title="Calendar" frs="§6.14 Availability + §6.16 Bookings" stage="Stage 3 · Booking core" />
}
