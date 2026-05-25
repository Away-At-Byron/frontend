"use client"

/**
 * Toast messages — ported from `docs/Toast Messages Guide.html`.
 * Six tones (success / info / warn / error / neutral / inverted) bound to the
 * Editorial Sunrise tokens in globals.css. Stack bottom-right, max 3 visible.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success({ title: "Booking confirmed", message: "Liliana · Away 03" })
 *   toast.error({ title: "Xero push failed", message: "…", actions: [{ label: "Retry", onClick: retry, primary: true }] })
 */
import {
  createContext, useCallback, useContext, useEffect, useId, useMemo,
  useRef, useState, type CSSProperties, type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Info, TriangleAlert, XCircle, RotateCcw, X } from "lucide-react"

type Style = CSSProperties

export type ToastTone = "success" | "info" | "warn" | "error" | "neutral"

export type ToastAction = {
  label: string
  onClick: () => void
  primary?: boolean
}

export type ToastInput = {
  title: ReactNode
  message?: ReactNode
  tone?: ToastTone
  inverted?: boolean
  actions?: ToastAction[]
  /** Override the default per-tone duration. 0 = sticky. */
  durationMs?: number
  icon?: ReactNode
}

type ToastRecord = ToastInput & { id: string }

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 4000,
  warn: 6000,
  error: 0,
  neutral: 6000,
}

const TONE_STYLES: Record<ToastTone, { border: string; iconBg: string; iconFg: string }> = {
  success: { border: "var(--teal-deep)", iconBg: "rgba(157,201,196,.32)", iconFg: "#3D5C5A" },
  info:    { border: "var(--teal)",      iconBg: "var(--mist)",            iconFg: "#3D5C5A" },
  warn:    { border: "var(--apricot)",   iconBg: "rgba(232,183,158,.42)", iconFg: "#A8624B" },
  error:   { border: "var(--terra)",     iconBg: "rgba(199,126,99,.20)",  iconFg: "#A8624B" },
  neutral: { border: "var(--ink-mute)",  iconBg: "#F4EDDF",                iconFg: "#5A4A3A" },
}

function defaultIconFor(tone: ToastTone) {
  const props = { size: 18, strokeWidth: 2 }
  switch (tone) {
    case "success": return <CheckCircle2 {...props} />
    case "info":    return <Info {...props} />
    case "warn":    return <TriangleAlert {...props} />
    case "error":   return <XCircle {...props} />
    case "neutral": return <RotateCcw {...props} />
  }
}

// ─── Toast (presentational) ──────────────────────────────────
export function Toast({
  title,
  message,
  tone = "info",
  inverted = false,
  actions,
  icon,
  onClose,
  style = {},
}: {
  title: ReactNode
  message?: ReactNode
  tone?: ToastTone
  inverted?: boolean
  actions?: ToastAction[]
  icon?: ReactNode
  onClose?: () => void
  style?: Style
}) {
  const t = TONE_STYLES[tone]
  const bg = inverted ? "#1F2A2A" : "#FFFFFF"
  const titleColor = inverted ? "#FBF8F3" : "var(--ink)"
  const msgColor = inverted ? "rgba(251,248,243,.7)" : "var(--ink-soft)"
  const closeColor = inverted ? "rgba(251,248,243,.55)" : "var(--ink-faint)"
  const borderColor = inverted ? "rgba(255,255,255,.08)" : "rgba(31,42,42,.08)"
  const shadow = inverted
    ? "0 1px 0 rgba(255,255,255,.06) inset, 0 18px 40px -18px rgba(0,0,0,.6)"
    : "0 1px 0 rgba(255,255,255,.5) inset, 0 18px 40px -18px rgba(31,42,42,.28), 0 1px 0 rgba(31,42,42,.04)"

  const iconBg = inverted ? "rgba(157,201,196,.18)" : t.iconBg
  const iconFg = inverted ? "#9DC9C4" : t.iconFg

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: bg,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${t.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        width: 380,
        maxWidth: "100%",
        boxShadow: shadow,
        fontFamily: "var(--font-sans), sans-serif",
        ...style,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconBg, color: iconFg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        {icon ?? defaultIconFor(tone)}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400, fontSize: 15, lineHeight: 1.2, color: titleColor,
          }}
        >
          {title}
        </div>
        {message && (
          <div style={{ fontSize: 12.5, color: msgColor, lineHeight: 1.5, marginTop: 4 }}>
            {message}
          </div>
        )}
        {actions && actions.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {actions.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={a.onClick}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  font: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: ".02em",
                  cursor: "pointer",
                  border: a.primary ? "1px solid transparent" : `1px solid ${inverted ? "rgba(255,255,255,.18)" : "rgba(31,42,42,.16)"}`,
                  background: a.primary ? "var(--ink)" : "transparent",
                  color: a.primary ? "#FBF8F3" : (inverted ? "rgba(251,248,243,.85)" : "var(--ink-soft)"),
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            width: 22, height: 22, borderRadius: 6, border: "none",
            background: "transparent", cursor: "pointer", color: closeColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "-2px -4px 0 0",
            flex: "0 0 auto",
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

// ─── Provider + hook ─────────────────────────────────────────
type ToastApi = {
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
  success: (input: Omit<ToastInput, "tone">) => string
  info: (input: Omit<ToastInput, "tone">) => string
  warn: (input: Omit<ToastInput, "tone">) => string
  error: (input: Omit<ToastInput, "tone">) => string
  neutral: (input: Omit<ToastInput, "tone">) => string
}

const ToastContext = createContext<ToastApi | null>(null)

const MAX_VISIBLE = 3

export type ToastPosition = "bottom-right" | "top-right"

export function ToastProvider({
  children,
  position = "bottom-right",
}: {
  children: ReactNode
  position?: ToastPosition
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const counter = useRef(0)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
    setToasts((list) => list.filter((x) => x.id !== id))
  }, [])

  const show = useCallback((input: ToastInput) => {
    counter.current += 1
    const id = `t${counter.current}`
    const tone: ToastTone = input.tone ?? "info"
    const hasAction = !!(input.actions && input.actions.length > 0)
    // When a toast carries an action, keep it sticky unless explicitly overridden.
    const duration = input.durationMs ?? (hasAction && tone === "warn" ? 0 : DEFAULT_DURATION[tone])

    setToasts((list) => {
      const next = [...list, { ...input, id, tone }]
      // Cap visible: drop the oldest beyond MAX_VISIBLE.
      if (next.length > MAX_VISIBLE) {
        const overflow = next.slice(0, next.length - MAX_VISIBLE)
        overflow.forEach((o) => {
          const handle = timers.current.get(o.id)
          if (handle) { clearTimeout(handle); timers.current.delete(o.id) }
        })
        return next.slice(-MAX_VISIBLE)
      }
      return next
    })

    if (duration > 0) {
      const handle = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, handle)
    }
    return id
  }, [dismiss])

  useEffect(() => {
    const map = timers.current
    return () => { map.forEach((h) => clearTimeout(h)); map.clear() }
  }, [])

  const api = useMemo<ToastApi>(() => ({
    show,
    dismiss,
    success: (i) => show({ ...i, tone: "success" }),
    info:    (i) => show({ ...i, tone: "info" }),
    warn:    (i) => show({ ...i, tone: "warn" }),
    error:   (i) => show({ ...i, tone: "error" }),
    neutral: (i) => show({ ...i, tone: "neutral" }),
  }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
  position,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
  position: ToastPosition
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || typeof document === "undefined") return null

  const isTop = position === "top-right"
  const ordered = isTop ? toasts : [...toasts].reverse()

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        right: 24,
        top: isTop ? 24 : "auto",
        bottom: isTop ? "auto" : 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {ordered.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <Toast
            title={t.title}
            message={t.message}
            tone={t.tone}
            inverted={t.inverted}
            actions={t.actions}
            icon={t.icon}
            onClose={() => onDismiss(t.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}

// Re-exported so the dialog/banner components can share a stable id helper.
export function useStableId(prefix = "id") {
  const id = useId()
  return `${prefix}-${id}`
}
