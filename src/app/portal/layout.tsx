import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

/**
 * Portal layout — contacts only. Staff sessions bounce to /home; the signin
 * sub-route opts out of the auth check below (it's a public page).
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user && session.user.subjectType !== "contact") redirect("/home")
  return <>{children}</>
}
