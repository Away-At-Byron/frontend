"use client"

import { useEffect, type ReactNode } from "react"

/**
 * Lightweight modal — this system has no Radix/Dialog primitive, so a
 * token-themed overlay matching the design bundle. Esc + backdrop close.
 */
export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(31,42,42,.42)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "64px 20px",
        overflowY: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-4)",
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Shared styled text input for the user modals. */
export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="caps" style={{ color: "var(--ink-faint)" }}>
        {label}
      </span>
      {children}
      {error && (
        <span style={{ fontSize: 12, color: "var(--terra-deep)" }}>{error}</span>
      )}
    </label>
  )
}

export const inputStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--r-2)",
  border: "1px solid var(--line)",
  background: "var(--linen)",
  font: "inherit",
  fontSize: 13.5,
  color: "var(--ink)",
  outline: "none",
}
