"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { inputStyle } from "@/modules/users/components/modal"

export type SearchSelectOption = { value: string; label: string }

/**
 * Searchable single-select. Stores `option.value`. No Radix/Combobox
 * primitive in this repo, so a token-themed popover matching BirthdayPicker:
 * click-outside and Esc close it. Drives the country and AU-state pickers.
 */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Type here to search",
  clearLabel = "Clear",
  emptyLabel = "No matches",
}: {
  value: string
  onChange: (next: string) => void
  options: readonly SearchSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  clearLabel?: string
  emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [query, options])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setActive(0)
    const focus = setTimeout(() => inputRef.current?.focus(), 0)
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
      clearTimeout(focus)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open])

  // Keep the highlighted row visible as the user arrows through the list.
  useEffect(() => {
    if (!open) return
    const row = listRef.current?.children[active] as HTMLElement | undefined
    row?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const hit = results[active]
      if (hit) pick(hit.value)
    }
  }

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
        <span style={{ color: selected ? "var(--ink)" : "var(--ink-faint)" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} color="var(--ink-soft)" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={placeholder}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 10,
            padding: 8,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-3)",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          <div style={{ position: "relative", marginBottom: 6 }}>
            <Search
              size={14}
              color="var(--ink-soft)"
              aria-hidden
              style={{ position: "absolute", left: 10, top: 13 }}
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onSearchKey}
              placeholder={searchPlaceholder}
              style={{ ...inputStyle, width: "100%", paddingLeft: 30 }}
            />
          </div>

          <div ref={listRef} style={{ maxHeight: 220, overflowY: "auto" }}>
            {results.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--ink-faint)" }}>
                {emptyLabel}
              </div>
            ) : (
              results.map((o, i) => {
                const isSelected = o.value === value
                const isActive = i === active
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pick(o.value)}
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
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      font: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span>{o.label}</span>
                    {isSelected && <Check size={14} color="var(--ink-soft)" aria-hidden />}
                  </button>
                )
              })
            )}
          </div>

          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              style={{
                marginTop: 6,
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
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
