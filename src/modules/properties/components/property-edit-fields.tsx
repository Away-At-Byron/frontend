"use client"

import type { CSSProperties, ReactNode } from "react"
import { Card } from "@/components/ui/primitives"
import { Icon, type IconName } from "@/components/ui/icon"

export function SectionCard({
  icon,
  title,
  headerAction,
  children,
}: {
  icon: IconName
  title: string
  headerAction?: ReactNode
  children: ReactNode
}) {
  return (
    <Card pad={0}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 22px",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <Icon name={icon} size={16} />
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
          }}
        >
          {title}
        </div>
        {headerAction ? <div style={{ marginLeft: "auto" }}>{headerAction}</div> : null}
      </div>
      <div>{children}</div>
    </Card>
  )
}

export function Row({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "150px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "10px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 10,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function SubHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "12px 22px 4px",
        borderTop: "1px solid var(--line-soft)",
        background: "var(--linen-soft)",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 10,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </div>
    </div>
  )
}

export const fieldStyle: CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--line)",
  background: "var(--paper)",
  font: "inherit",
  fontSize: 13.5,
  color: "var(--ink)",
  outline: "none",
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  mono,
}: {
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  mono?: boolean
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...fieldStyle,
        fontFamily: mono ? "var(--font-mono), monospace" : "inherit",
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  )
}

export function SelectInput({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        ...fieldStyle,
        appearance: "auto",
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : undefined,
      }}
    >
      {placeholder ? (
        <option value="">{placeholder}</option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function ReadOnlyValue({
  value,
  hint,
  mono,
}: {
  value: string
  hint?: string
  mono?: boolean
}) {
  return (
    <div
      style={{
        background: "var(--linen-soft)",
        border: "1px solid var(--line-soft)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 36,
      }}
    >
      <span
        style={{
          flex: 1,
          fontFamily: mono ? "var(--font-mono), monospace" : "inherit",
          fontSize: 13.5,
          color: value ? "var(--ink-soft)" : "var(--ink-faint)",
        }}
      >
        {value || "—"}
      </span>
      {hint ? (
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            color: "var(--ink-faint)",
            letterSpacing: "var(--tracked)",
            textTransform: "uppercase",
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  )
}
