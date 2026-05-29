"use client"

import { Card } from "@/components/ui/primitives"

export function FormCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card pad={0}>
      <div
        style={{
          padding: "14px 18px",
          fontFamily: "var(--font-display), serif",
          fontSize: 17,
          fontWeight: 400,
        }}
      >
        {title}
      </div>
      {children}
    </Card>
  )
}

export function FieldRow({
  label,
  children,
  error,
  hint,
}: {
  label: string
  children: React.ReactNode
  error?: string[]
  hint?: string
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "10px 18px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{label}</label>
      <div>
        {children}
        {error && error.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--bad-fg)" }}>
            {error[0]}
          </div>
        )}
        {!error && hint && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-faint)" }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type,
  step,
  min,
  prefix,
  suffix,
  mono,
  disabled,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: "text" | "number" | "date"
  step?: number
  min?: number
  prefix?: string
  suffix?: string
  mono?: boolean
  disabled?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: disabled ? "var(--linen-soft)" : "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        gap: 6,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {prefix && (
        <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{prefix}</span>
      )}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        step={step}
        min={min}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          font: "inherit",
          fontFamily: mono
            ? "var(--font-mono), monospace"
            : "var(--font-sans), sans-serif",
          fontSize: 13.5,
          color: disabled ? "var(--ink-soft)" : "var(--ink)",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {suffix && (
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-faint)",
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  )
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange?: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        font: "inherit",
        fontSize: 13.5,
        color: "var(--ink)",
        outline: "none",
      }}
    >
      {children}
    </select>
  )
}

export function ReadOnlyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "var(--linen-soft)",
        border: "1px solid var(--line-soft)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--ink-faint)",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  )
}
