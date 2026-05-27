import type { DiscountStatus } from "./types"

/**
 * Live status from activation mode + dates. Pure function so it works in
 * both the server query (computed for the DTO) and the client (when the
 * UI optimistically updates a row).
 */
export function computeStatus(row: {
  activationMode: "duration" | "manual"
  durationStart: string | null
  durationEnd: string | null
}): DiscountStatus {
  if (row.activationMode === "manual") return "active"

  const today = new Date()
  // Compare against the calendar day in the server's local zone (UTC for
  // the date columns, which are stored as date / no zone).
  const todayStr = today.toISOString().slice(0, 10)

  if (row.durationStart && todayStr < row.durationStart) return "scheduled"
  if (row.durationEnd && todayStr > row.durationEnd) return "expired"
  return "active"
}
