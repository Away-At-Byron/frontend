import type { ContactRow } from "./types"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** "11-21" -> "21 Nov". Birthdays are stored day + month only, no year. */
export function formatBirthday(md: string | null | undefined): string | null {
  if (!md) return null
  const [mm, dd] = md.split("-")
  const monthIdx = Number(mm) - 1
  if (!dd || monthIdx < 0 || monthIdx > 11) return null
  return `${dd} ${MONTHS[monthIdx]}`
}

/** Contacts with a birthday in the current calendar month. */
export function birthdaysThisMonth(rows: ContactRow[], now = new Date()): ContactRow[] {
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
  return rows.filter((r) => r.birthday?.slice(0, 2) === currentMonth)
}
