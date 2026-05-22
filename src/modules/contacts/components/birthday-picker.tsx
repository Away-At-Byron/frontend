"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { inputStyle } from "@/modules/users/components/modal"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Days in a month, using a leap year so 29 February stays selectable. */
function daysInMonth(month1to12: number): number {
  return new Date(2024, month1to12, 0).getDate()
}

/** "MM-DD" -> { mm, dd }; anything malformed -> nulls. */
function parse(value: string): { mm: number | null; dd: number | null } {
  const m = /^(\d{2})-(\d{2})$/.exec(value)
  if (!m) return { mm: null, dd: null }
  return { mm: Number(m[1]), dd: Number(m[2]) }
}

function label(value: string): string | null {
  const { mm, dd } = parse(value)
  if (!mm || !dd) return null
  return `${dd} ${MONTHS[mm - 1]}`
}

/**
 * Day + month birthday picker. Stores "MM-DD" (no year — see ADR-002).
 * No weekday header: without a year, weekday alignment would be arbitrary,
 * so the grid is a plain run of day numbers.
 */
export function BirthdayPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { mm: selMonth, dd: selDay } = parse(value)
  // Month shown in the grid — defaults to the saved month, else this month.
  const [viewMonth, setViewMonth] = useState(selMonth ?? new Date().getMonth() + 1)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setViewMonth(selMonth ?? new Date().getMonth() + 1)
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, selMonth])

  const stepMonth = (delta: number) =>
    setViewMonth((m) => ((m - 1 + delta + 12) % 12) + 1)

  const pick = (day: number) => {
    const mm = String(viewMonth).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    onChange(`${mm}-${dd}`)
    setOpen(false)
  }

  const text = label(value)

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: text ? "var(--ink)" : "var(--ink-faint)" }}>
          {text ?? "Select day and month"}
        </span>
        <Calendar size={15} color="var(--ink-soft)" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a birthday"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 10,
            width: 268,
            padding: 12,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-3)",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <NavBtn label="Previous month" onClick={() => stepMonth(-1)}>
              <ChevronLeft size={16} />
            </NavBtn>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
              {MONTHS[viewMonth - 1]}
            </span>
            <NavBtn label="Next month" onClick={() => stepMonth(1)}>
              <ChevronRight size={16} />
            </NavBtn>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {Array.from({ length: daysInMonth(viewMonth) }, (_, i) => {
              const day = i + 1
              const isSelected = viewMonth === selMonth && day === selDay
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  style={{
                    height: 32,
                    borderRadius: "var(--r-1)",
                    border: "1px solid transparent",
                    background: isSelected ? "var(--ink)" : "transparent",
                    color: isSelected ? "var(--linen)" : "var(--ink)",
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {text && (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              style={{
                marginTop: 10,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 30,
                borderRadius: "var(--r-2)",
                border: "1px solid var(--line-soft)",
                background: "transparent",
                color: "var(--ink-soft)",
                fontSize: 12.5,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <X size={13} aria-hidden />
              Clear birthday
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NavBtn({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "var(--r-1)",
        border: "1px solid var(--line)",
        background: "var(--linen)",
        color: "var(--ink)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}
