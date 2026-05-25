/**
 * Australian states and territories (ISO 3166-2:AU short codes).
 *
 * Sourced from the `export-suburb-autofill` module's `AUSTRALIAN_STATES`
 * list. Used for the State picker when a contact's country is Australia.
 */
export type AustralianState = { code: string; name: string }

export const AUSTRALIAN_STATES: readonly AustralianState[] = [
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "WA", name: "Western Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
] as const
