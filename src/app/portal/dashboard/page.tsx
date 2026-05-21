import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function PortalDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.subjectType !== "contact") {
    redirect("/portal/signin")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--linen)",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div className="caps" style={{ color: "var(--ink-faint)" }}>Portal</div>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 40,
            letterSpacing: "var(--tight)",
            margin: "8px 0 12px",
          }}
        >
          Hi {session.user.name?.split(" ")[0] ?? "there"}.
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.6 }}>
          You are signed in. Your portal will appear here soon.
        </p>
      </div>
    </div>
  )
}
