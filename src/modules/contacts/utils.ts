import type { ContactRow, ContactTier } from "./types"

export function tierFor(row: {
  isVip: boolean
  returningGuest: boolean
}): ContactTier {
  if (row.isVip) return "vip"
  if (row.returningGuest) return "returning"
  return "new"
}

export function formatBirthday(d: Date | null): string | null {
  if (!d) return null
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`
}

/** Contacts with a birthday in the current calendar month. */
export function birthdaysThisMonth(rows: ContactRow[], now = new Date()): ContactRow[] {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  const current = months[now.getMonth()]
  return rows.filter((r) => {
    if (!r.birthday) return false
    const parts = r.birthday.split(" ")
    return parts.length >= 2 && parts[1] === current
  })
}
