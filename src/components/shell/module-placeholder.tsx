import { RoomArt } from "@/components/ui/room-art"

/**
 * Shown for nav destinations whose module hasn't landed yet. Keeps the
 * shell fully navigable from day one; each owning dev replaces the route's
 * page.tsx with the real screen when their module is built.
 */
export function ModulePlaceholder({
  title,
  frs,
  stage,
}: {
  title: string
  frs: string
  stage: string
}) {
  return (
    <div style={{ padding: "64px 32px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 220, height: 150, margin: "0 auto 28px", borderRadius: "var(--r-4)", overflow: "hidden", border: "1px solid var(--line)" }}>
        <RoomArt palette="teal" />
      </div>
      <div className="caps" style={{ color: "var(--ink-faint)" }}>{stage}</div>
      <h1
        style={{
          fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 38,
          letterSpacing: "var(--tight)", margin: "10px 0 12px",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.6 }}>
        This screen is scaffolded but not built yet. The owning developer replaces
        this route&rsquo;s <span className="mono">page.tsx</span> with the real module.
      </p>
      <p className="mono" style={{ marginTop: 14, fontSize: 11, color: "var(--ink-faint)" }}>
        Spec: {frs} · docs/frs-v0.2.md
      </p>
    </div>
  )
}
