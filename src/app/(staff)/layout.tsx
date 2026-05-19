import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppShell } from "@/components/shell/app-shell"
import { getAllowedModules, visibleNav } from "@/lib/access"

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/signin")

  const role = session.user.role ?? "other"
  const allowed = await getAllowedModules(session.user.id, role)

  return (
    <AppShell
      user={{
        name: session.user.name ?? session.user.email ?? "Staff",
        role,
      }}
      nav={visibleNav(role, allowed)}
    >
      {children}
    </AppShell>
  )
}
