"use client"

import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { inputStyle } from "@/modules/users/components/modal"
import { searchSuburbsAsync, type SuburbData } from "@/data/australian-suburbs"

/**
 * Suburb autocomplete for AU contacts. Free-text input bound to
 * `addressSuburb`; live search hits the local curated list first, then the
 * cached Matthew Proctor dataset (see `src/data/australian-suburbs.ts`).
 * Picking a result invokes `onPick`, which the form uses to autofill
 * State and Postcode.
 */
export function SuburbAutocomplete({
  value,
  onChange,
  onPick,
}: {
  value: string
  onChange: (next: string) => void
  onPick: (suburb: SuburbData) => void
}) {
  const [results, setResults] = useState<SuburbData[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  // Skip the search that would fire from the value we just picked.
  const lastPicked = useRef<string | null>(null)

  useEffect(() => {
    const q = value.trim()
    if (!q || lastPicked.current === q) {
      setResults([])
      return
    }
    const id = ++seq.current
    const t = setTimeout(() => {
      searchSuburbsAsync(q)
        .then((r) => {
          if (id !== seq.current) return
          setResults(r.slice(0, 50))
          setActive(0)
        })
        .catch(() => {
          if (id === seq.current) setResults([])
        })
    }, 150)
    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [])

  const pick = (s: SuburbData) => {
    lastPicked.current = s.name
    onChange(s.name)
    onPick(s)
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const hit = results[active]
      if (hit) pick(hit)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          color="var(--ink-soft)"
          aria-hidden
          style={{ position: "absolute", left: 12, top: 13 }}
        />
        <input
          value={value}
          onChange={(e) => {
            lastPicked.current = null
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type here to search"
          style={{ ...inputStyle, width: "100%", paddingLeft: 32 }}
        />
      </div>
      {open && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 10,
            padding: 6,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-3)",
            boxShadow: "var(--shadow-pop)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {results.map((s, i) => {
            const isActive = i === active
            return (
              <button
                key={`${s.name}-${s.state}-${s.postcode}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActive(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: "var(--r-1)",
                  border: "1px solid transparent",
                  background: isActive ? "var(--linen)" : "transparent",
                  color: "var(--ink)",
                  fontSize: 13.5,
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                }}
              >
                <span>{s.name}</span>
                <span style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>
                  {s.state} · {s.postcode}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
