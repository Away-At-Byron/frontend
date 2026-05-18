/**
 * The ONLY shape a server action returns across the wire (CLAUDE.md rule 7).
 * No throwing across the network boundary — convert to a tagged union.
 */
export type ActionOk<T> = { ok: true; data: T }
export type ActionErr = {
  ok: false
  error: {
    code:
      | "VALIDATION"
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "RATE_LIMITED"
      | "INTERNAL"
    message: string
    fields?: Record<string, string[] | undefined>
  }
}
export type ActionResult<T> = ActionOk<T> | ActionErr

export const ok = <T>(data: T): ActionOk<T> => ({ ok: true, data })

export const err = (
  code: ActionErr["error"]["code"],
  message: string,
  fields?: ActionErr["error"]["fields"],
): ActionErr => ({ ok: false, error: { code, message, fields } })
