"use client"

import { toggleableModulesForRole } from "@/lib/modules"

/**
 * Per-user module toggles, scoped to the selected role's STATIC default
 * (src/lib/modules.ts → ROLE_DEFAULTS). An admin can switch some off for
 * this user; modules outside the role default never appear here.
 */
export function AccessToggles({
  roleName,
  selected,
  onChange,
}: {
  roleName: string
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const items = toggleableModulesForRole(roleName)

  const note = (text: string) => (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--r-2)",
        background: "var(--shell)",
        fontSize: 12.5,
        color: "var(--ink-soft)",
      }}
    >
      {text}
    </div>
  )

  if (!roleName) return note("Pick a role to choose module access.")
  if (roleName === "admin")
    return note("Admin has full access. Not customisable.")
  if (items.length === 0)
    return note("This role has no optional modules — Dashboard only.")

  const toggle = (code: string) =>
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code],
    )

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      {items.map((m) => {
        const on = selected.includes(m.code)
        return (
          <label
            key={m.code}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "9px 11px",
              borderRadius: "var(--r-2)",
              border: "1px solid var(--line)",
              background: on ? "var(--shell)" : "var(--linen)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <span>{m.label}</span>
            <input
              type="checkbox"
              checked={on}
              onChange={() => toggle(m.code)}
              style={{ width: 16, height: 16, accentColor: "var(--ink)" }}
            />
          </label>
        )
      })}
    </div>
  )
}
