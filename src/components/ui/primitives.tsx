"use client"

/**
 * Away PMS — shared UI primitives. Ported 1:1 from the approved design
 * bundle (system/components.jsx). Inline styles bound to the CSS tokens in
 * globals.css so the visual output matches the prototype exactly.
 */
import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./icon"

type Style = CSSProperties

// ─── Button ──────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: { background: "var(--ink)", color: "var(--linen)", border: "1px solid var(--ink)" },
  teal: { background: "var(--teal)", color: "var(--ink)", border: "1px solid var(--teal)" },
  accent: { background: "var(--terra)", color: "var(--linen)", border: "1px solid var(--terra)" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid var(--line-strong)" },
  quiet: { background: "transparent", color: "var(--ink)", border: "1px solid transparent" },
  paper: { background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" },
  danger: { background: "transparent", color: "var(--terra-deep)", border: "1px solid rgba(168,98,75,.32)" },
}
const BTN_SIZES = {
  sm: { height: 32, padding: "0 12px", fontSize: 12, gap: 6 },
  md: { height: 40, padding: "0 18px", fontSize: 13, gap: 8 },
  lg: { height: 48, padding: "0 22px", fontSize: 14, gap: 10 },
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  type = "button",
  disabled,
  style = {},
}: {
  variant?: keyof typeof BTN_VARIANTS
  size?: keyof typeof BTN_SIZES
  icon?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  style?: Style
}) {
  const s = BTN_SIZES[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_VARIANTS[variant],
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: "var(--r-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontFamily: "var(--font-sans), sans-serif",
        fontWeight: 600,
        letterSpacing: ".01em",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        whiteSpace: "nowrap",
        transition: "transform .08s, box-shadow .12s, background .12s",
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}

// ─── Icon Button ─────────────────────────────────────────────
export function IconButton({
  children,
  size = 38,
  variant = "shell",
  onClick,
  title,
  style = {},
}: {
  children: ReactNode
  size?: number
  variant?: "shell" | "paper" | "ink" | "quiet"
  onClick?: () => void
  title?: string
  style?: Style
}) {
  const bg =
    variant === "shell" ? "var(--shell)"
    : variant === "paper" ? "var(--paper)"
    : variant === "ink" ? "var(--ink)"
    : "transparent"
  const fg = variant === "ink" ? "var(--linen)" : "var(--ink)"
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size, borderRadius: "50%", border: "none",
        cursor: "pointer", background: bg, color: fg, position: "relative",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── Pill ────────────────────────────────────────────────────
const PILL_TONES = {
  neutral: { bg: "transparent", fg: "var(--ink)", bd: "var(--line-strong)" },
  ok: { bg: "var(--ok-bg)", fg: "var(--ok-fg)", bd: "transparent" },
  warn: { bg: "var(--warn-bg)", fg: "var(--warn-fg)", bd: "transparent" },
  bad: { bg: "var(--bad-bg)", fg: "var(--bad-fg)", bd: "transparent" },
  info: { bg: "var(--info-bg)", fg: "var(--info-fg)", bd: "transparent" },
  teal: { bg: "var(--teal)", fg: "var(--ink)", bd: "transparent" },
  accent: { bg: "var(--terra)", fg: "var(--linen)", bd: "transparent" },
  ink: { bg: "var(--ink)", fg: "var(--linen)", bd: "transparent" },
  paper: { bg: "var(--paper)", fg: "var(--ink)", bd: "var(--line)" },
}
const PILL_SIZES = {
  sm: { fontSize: 9.5, padding: "4px 8px", gap: 4 },
  md: { fontSize: 10, padding: "6px 10px", gap: 5 },
  lg: { fontSize: 11, padding: "8px 12px", gap: 6 },
}

export function Pill({
  children,
  tone = "neutral",
  size = "md",
  style = {},
}: {
  children: ReactNode
  tone?: keyof typeof PILL_TONES
  size?: keyof typeof PILL_SIZES
  style?: Style
}) {
  const t = PILL_TONES[tone]
  const s = PILL_SIZES[size]
  return (
    <span
      style={{
        background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
        fontSize: s.fontSize, padding: s.padding, gap: s.gap,
        borderRadius: "var(--r-pill)", fontFamily: "var(--font-mono), monospace",
        fontWeight: 500, letterSpacing: "var(--tracked)", textTransform: "uppercase",
        whiteSpace: "nowrap", display: "inline-flex", alignItems: "center",
        justifyContent: "center", ...style,
      }}
    >
      {children}
    </span>
  )
}

// ─── Filter Pill (toggle) ────────────────────────────────────
export function FilterPill({
  children,
  on,
  count,
  onClick,
  style = {},
}: {
  children: ReactNode
  on?: boolean
  count?: number
  onClick?: () => void
  style?: Style
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 34, padding: "0 14px", borderRadius: "var(--r-pill)", cursor: "pointer",
        background: on ? "var(--ink)" : "transparent",
        color: on ? "var(--linen)" : "var(--ink)",
        border: on ? "none" : "1px solid var(--line-strong)",
        fontFamily: "var(--font-mono), monospace", fontSize: 10, fontWeight: 500,
        letterSpacing: "var(--tracked)", textTransform: "uppercase",
        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
      {count != null && <span style={{ opacity: on ? 0.7 : 0.5 }}>· {count}</span>}
    </button>
  )
}

// ─── Card ────────────────────────────────────────────────────
const SURFACES = {
  paper: "var(--paper)", shell: "var(--shell)", linen: "var(--linen)",
  mist: "var(--mist)", ink: "var(--ink)",
}
export function Card({
  children,
  surface = "paper",
  pad = 20,
  style = {},
}: {
  children: ReactNode
  surface?: keyof typeof SURFACES
  pad?: number
  style?: Style
}) {
  return (
    <div
      style={{
        background: SURFACES[surface], borderRadius: "var(--r-3)", padding: pad,
        border: "1px solid var(--line)", boxShadow: "var(--shadow-1)", ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Stat block ──────────────────────────────────────────────
export function Stat({
  icon,
  label,
  value,
  sub,
  tone,
  style = {},
}: {
  icon: IconName
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: "ok" | "bad"
  style?: Style
}) {
  return (
    <div
      style={{
        background: "var(--paper)", borderRadius: "var(--r-3)", padding: "18px 20px",
        border: "1px solid var(--line)", boxShadow: "var(--shadow-1)", ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-faint)" }}>
        <Icon name={icon} size={15} strokeWidth={1.6} />
        <span className="caps">{label}</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 38,
          lineHeight: 1, letterSpacing: "var(--tight)", marginTop: 14,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ink-soft)" }}>
          {tone === "ok" && <span style={{ color: "var(--teal-ink)", fontWeight: 600 }}>↑ </span>}
          {tone === "bad" && <span style={{ color: "var(--terra-deep)", fontWeight: 600 }}>↓ </span>}
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────────────
const TINTS = {
  teal: { bg: "var(--teal)", fg: "var(--ink)" },
  shell: { bg: "var(--shell-deep)", fg: "var(--ink)" },
  sand: { bg: "var(--sand)", fg: "var(--ink)" },
  ink: { bg: "var(--ink)", fg: "var(--linen)" },
  apri: { bg: "var(--apricot)", fg: "var(--ink)" },
}
export function Avatar({
  name,
  size = 36,
  tint = "teal",
  src,
}: {
  name: string
  size?: number
  tint?: keyof typeof TINTS
  src?: string
}) {
  const t = TINTS[tint] ?? TINTS.teal
  const initials = (name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flex: "0 0 auto",
        background: t.bg, color: t.fg, overflow: "hidden",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display), serif", fontStyle: "italic",
        fontWeight: 400, fontSize: Math.round(size * 0.42),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  )
}

// ─── Section header ──────────────────────────────────────────
export function SectionHead({
  kicker,
  title,
  right,
  style = {},
}: {
  kicker?: string
  title?: string
  right?: ReactNode
  style?: Style
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 14, ...style,
      }}
    >
      <div>
        {kicker && <div className="caps" style={{ color: "var(--ink-faint)", marginBottom: 4 }}>{kicker}</div>}
        {title && (
          <div
            style={{
              fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 22,
              letterSpacing: "var(--tight)", lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}
