"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { inputStyle } from "@/modules/users/components/modal"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Parse "YYYY-MM-DD" → numbers; anything malformed → nulls. */
function parse(value: string): {
  yyyy: number | null
  mm: number | null
  dd: number | null
} {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return { yyyy: null, mm: null, dd: null }
  return { yyyy: Number(m[1]), mm: Number(m[2]), dd: Number(m[3]) }
}

/** "YYYY-MM-DD" → "DD-MM-YYYY" for display. */
function format(value: string): string | null {
  const { yyyy, mm, dd } = parse(value)
  if (!yyyy || !mm || !dd) return null
  return `${String(dd).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${yyyy}`
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate()
}

/** Mon-first weekday index (0..6) of the first day of the month. */
function leadingBlanks(year: number, month1to12: number): number {
  const jsDay = new Date(year, month1to12 - 1, 1).getDay()
  return (jsDay + 6) % 7
}

/**
 * Full date picker (year + month + day). Stores "YYYY-MM-DD"; displays
 * "DD-MM-YYYY". Same UX language as BirthdayPicker — popover with month
 * stepper and a day grid; year is editable inline above the grid.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const { yyyy: selYear, mm: selMonth, dd: selDay } = parse(value)
  const today = new Date()
  const [viewYear, setViewYear] = useState(selYear ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selMonth ?? today.getMonth() + 1)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false)
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
  }, [open])

  const toggleOpen = () => {
    setOpen((o) => {
      if (!o) {
        setViewYear(selYear ?? today.getFullYear())
        setViewMonth(selMonth ?? today.getMonth() + 1)
      }
      return !o
    })
  }

  const stepMonth = (delta: number) => {
    const total = (viewYear * 12 + (viewMonth - 1) + delta + 24000) % 24000
    setViewYear(Math.floor(total / 12))
    setViewMonth((total % 12) + 1)
  }

  const pick = (day: number) => {
    const yyyy = viewYear
    const mm = String(viewMonth).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    onChange(`${yyyy}-${mm}-${dd}`)
    setOpen(false)
  }

  const text = format(value)
  const blanks = leadingBlanks(viewYear, viewMonth)

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={toggleOpen}
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
          {text ?? placeholder}
        </span>
        <Calendar size={15} color="var(--ink-soft)" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a date"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 10,
            width: 280,
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
              gap: 8,
            }}
          >
            <NavBtn label="Previous month" onClick={() => stepMonth(-1)}>
              <ChevronLeft size={16} />
            </NavBtn>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <span>{MONTHS[viewMonth - 1]}</span>
              <input
                type="number"
                value={viewYear}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isFinite(n) && n >= 1900 && n <= 2100)
                    setViewYear(n)
                }}
                style={{
                  width: 64,
                  height: 26,
                  padding: "0 6px",
                  borderRadius: "var(--r-1)",
                  border: "1px solid var(--line)",
                  background: "var(--linen)",
                  font: "inherit",
                  fontSize: 13,
                  color: "var(--ink)",
                  textAlign: "center",
                }}
              />
            </div>
            <NavBtn label="Next month" onClick={() => stepMonth(1)}>
              <ChevronRight size={16} />
            </NavBtn>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 4,
            }}
          >
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="caps"
                style={{
                  textAlign: "center",
                  fontSize: 9.5,
                  color: "var(--ink-faint)",
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {Array.from({ length: blanks }).map((_, i) => (
              <div key={`b${i}`} />
            ))}
            {Array.from(
              { length: daysInMonth(viewYear, viewMonth) },
              (_, i) => {
                const day = i + 1
                const isSelected =
                  viewYear === selYear &&
                  viewMonth === selMonth &&
                  day === selDay
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
              },
            )}
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
              Clear date
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
