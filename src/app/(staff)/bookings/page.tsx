import { ModulePlaceholder } from "@/components/shell/module-placeholder"
import { assertModuleAccess } from "@/lib/access"

export default async function Page() {
  await assertModuleAccess("bookings")
  return <ModulePlaceholder title="Reservations" frs="§6.16 Bookings" stage="Stage 3 · Booking core" />
}
