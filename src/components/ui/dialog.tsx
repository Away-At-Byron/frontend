"use client"

/**
 * Confirmation dialog — replaces window.confirm() for destructive or
 * one-way actions. Ported from `docs/Toast Messages Guide.html` § 01.
 *
 * Two usage modes:
 *   1. Declarative <ConfirmDialog open … /> for forms that own state.
 *   2. Imperative useConfirm(): await confirm({ tone: "danger", title: … })
 *      returns true/false. Pair with <ConfirmDialogProvider> at the app root.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type CSSProperties, type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { Info, TriangleAlert } from "lucide-react"

type Style = CSSProperties

export type DialogTone = "danger" | "warn" | "info"

const TONE: Record<DialogTone, { iconBg: string; iconFg: string }> = {
  danger: { iconBg: "rgba(199,126,99,.18)", iconFg: "#A8624B" },
  warn:   { iconBg: "rgba(232,183,158,.42)", iconFg: "#A8624B" },
  info:   { iconBg: "var(--mist)",            iconFg: "#3D5C5A" },
}

function defaultIcon(tone: DialogTone) {
  const p = { size: 20, strokeWidth: 1.8 }
  if (tone === "info") return <Info {...p} />
  return <TriangleAlert {...p} />
}

export function ConfirmDialog({
  open,
  tone = "info",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  icon,
}: {
  open: boolean
  tone?: DialogTone
  title: ReactNode
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  icon?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
      if (e.key === "Enter") onConfirm()
    }
    document.addEventListener("keydown", onKey)
    confirmRef.current?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onCancel, onConfirm])

  if (!mounted || !open || typeof document === "undefined") return null

  const t = TONE[tone]
  const confirmStyle: Style = tone === "danger"
    ? { background: "var(--terra)", color: "#FBF8F3", border: "1px solid transparent" }
    : { background: "var(--ink)", color: "#FBF8F3", border: "1px solid transparent" }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(31,42,42,.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          width: 420,
          maxWidth: "100%",
          padding: "24px 24px 20px",
          boxShadow: "0 1px 0 rgba(255,255,255,.5) inset, 0 28px 60px -20px rgba(31,42,42,.4), 0 0 0 1px rgba(31,42,42,.05)",
          position: "relative",
          fontFamily: "var(--font-sans), sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: t.iconBg, color: t.iconFg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flex: "0 0 auto",
            }}
          >
            {icon ?? defaultIcon(tone)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 400, fontSize: 21, lineHeight: 1.2,
              letterSpacing: "-.01em", color: "var(--ink)",
              alignSelf: "center",
            }}
          >
            {title}
          </div>
        </div>

        {message && (
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)", margin: "0 0 18px" }}>
            {message}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px", borderRadius: 999, cursor: "pointer",
              font: "inherit", fontSize: 13, fontWeight: 600, letterSpacing: ".01em",
              background: "transparent", color: "var(--ink)",
              border: "1px solid rgba(31,42,42,.14)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 18px", borderRadius: 999, cursor: "pointer",
              font: "inherit", fontSize: 13, fontWeight: 600, letterSpacing: ".01em",
              ...confirmStyle,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Imperative confirm() ────────────────────────────────────
type ConfirmOptions = {
  tone?: DialogTone
  title: ReactNode
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  icon?: ReactNode
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

type PendingConfirm = ConfirmOptions & { resolve: (v: boolean) => void }

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve })
    })
  }, [])

  const close = useCallback((value: boolean) => {
    setPending((p) => {
      p?.resolve(value)
      return null
    })
  }, [])

  const api = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        tone={pending?.tone}
        title={pending?.title ?? ""}
        message={pending?.message}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        icon={pending?.icon}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmDialogProvider>")
  return ctx
}
