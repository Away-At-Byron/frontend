"use client"

/**
 * Inline banners — persistent context that sits inside page flow above
 * the affected content. Ported from `docs/Toast Messages Guide.html` § 04.
 * Never auto-dismiss. Use a toast for transient feedback instead.
 */
import type { CSSProperties, ReactNode } from "react"
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react"

type Style = CSSProperties

export type BannerTone = "success" | "info" | "warn" | "error"

const TONE: Record<BannerTone, { border: string; iconBg: string; iconFg: string }> = {
  success: { border: "var(--teal-deep)", iconBg: "rgba(157,201,196,.32)", iconFg: "#3D5C5A" },
  info:    { border: "var(--teal)",      iconBg: "var(--mist)",            iconFg: "#3D5C5A" },
  warn:    { border: "var(--apricot)",   iconBg: "rgba(232,183,158,.42)", iconFg: "#A8624B" },
  error:   { border: "var(--terra)",     iconBg: "rgba(199,126,99,.20)",  iconFg: "#A8624B" },
}

function iconFor(tone: BannerTone) {
  const p = { size: 16, strokeWidth: 2 }
  switch (tone) {
    case "success": return <CheckCircle2 {...p} />
    case "info":    return <Info {...p} />
    case "warn":    return <TriangleAlert {...p} />
    case "error":   return <XCircle {...p} />
  }
}

export function Banner({
  tone = "info",
  title,
  message,
  actions,
  icon,
  style = {},
}: {
  tone?: BannerTone
  title: ReactNode
  message?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  style?: Style
}) {
  const t = TONE[tone]
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#FFFFFF",
        border: "1px solid rgba(31,42,42,.08)",
        borderLeft: `3px solid ${t.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        width: "100%",
        ...style,
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: 7,
          background: t.iconBg, color: t.iconFg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        {icon ?? iconFor(tone)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400, fontSize: 14.5, color: "var(--ink)",
          }}
        >
          {title}
        </div>
        {message && (
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
            {message}
          </div>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 6 }}>{actions}</div>}
    </div>
  )
}
