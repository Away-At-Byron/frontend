import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppShell } from "@/components/shell/app-shell"

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/signin")

  return (
    <AppShell
      user={{
        name: session.user.name ?? session.user.email ?? "Staff",
        role: session.user.role ?? "staff",
      }}
    >
      {children}
    </AppShell>
  )
}
