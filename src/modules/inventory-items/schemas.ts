import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Keep it under 100 characters")

const type = z.enum(["asset", "inventory", "consumable"])
const status = z.enum(["in_service", "unavailable", "retired"])

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null))

const photoKey = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))

const supplierContactId = z
  .string()
  .uuid("Pick a supplier")
  .optional()
  .nullable()
  .transform((v) => v ?? null)

/** Required non-negative integer (0 default for empty string). */
const intNonNeg = z
  .union([
    z.literal("").transform(() => 0),
    z.coerce.number().int("Whole number").min(0, "0 or higher"),
  ])
  .optional()
  .transform((v) => (v === undefined ? 0 : v))

/** Nullable non-negative integer (empty string → null). */
const intNonNegNullable = z
  .union([
    z.literal("").transform(() => null),
    z.coerce.number().int("Whole number").min(0, "0 or higher"),
  ])
  .optional()
  .nullable()
  .transform((v) => (v === undefined || v === null ? null : v))

/** Nullable dollar input → null or number; action multiplies by 100. */
const moneyNullable = z
  .union([
    z.literal("").transform(() => null),
    z.coerce.number().min(0, "0 or higher"),
  ])
  .optional()
  .nullable()
  .transform((v) => (v === undefined || v === null ? null : v))

/** ISO date string ("YYYY-MM-DD") or null. */
const isoDateNullable = z
  .union([
    z.literal("").transform(() => null),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  ])
  .optional()
  .nullable()
  .transform((v) => (v === undefined || v === null ? null : v))

const storageAllocation = z.object({
  storageLocationId: z.string().uuid("Pick a storage location"),
  qty: z.coerce.number().int("Whole number").min(0, "0 or higher"),
})

const shape = {
  name,
  type,
  category: optionalText(60),
  status,
  description: optionalText(2000),
  photoKey,
  quantityOnHand: intNonNeg,

  // asset
  warrantyExpiry: isoDateNullable,
  expectedUsefulLife: optionalText(120),

  // inventory
  minimumThreshold: intNonNegNullable,
  replacementCost: moneyNullable,

  // consumable
  reorderLevel: intNonNegNullable,
  unitCost: moneyNullable,
  supplierContactId,
  lastRestockedDate: isoDateNullable,

  // inventory + consumable
  minimumReorderQty: intNonNegNullable,

  /** Storage allocations: one row per (location, qty) pair. */
  storageAllocations: z.array(storageAllocation).default([]),
}

function refine(s: z.ZodObject<typeof shape>) {
  return s.superRefine((data, ctx) => {
    // Per-type field gating. Mirrors the DB CHECK so the action can return a
    // friendly field-level error before the row hits Postgres.
    if (data.type === "asset") {
      const bad: Array<keyof typeof data> = []
      if (data.minimumThreshold != null) bad.push("minimumThreshold")
      if (data.replacementCost != null) bad.push("replacementCost")
      if (data.reorderLevel != null) bad.push("reorderLevel")
      if (data.unitCost != null) bad.push("unitCost")
      if (data.supplierContactId != null) bad.push("supplierContactId")
      if (data.lastRestockedDate != null) bad.push("lastRestockedDate")
      if (data.minimumReorderQty != null) bad.push("minimumReorderQty")
      bad.forEach((f) =>
        ctx.addIssue({
          path: [f as string],
          code: z.ZodIssueCode.custom,
          message: "Not allowed for assets",
        }),
      )
    } else if (data.type === "inventory") {
      const bad: Array<keyof typeof data> = []
      if (data.warrantyExpiry != null) bad.push("warrantyExpiry")
      if (data.expectedUsefulLife != null) bad.push("expectedUsefulLife")
      if (data.reorderLevel != null) bad.push("reorderLevel")
      if (data.unitCost != null) bad.push("unitCost")
      if (data.supplierContactId != null) bad.push("supplierContactId")
      if (data.lastRestockedDate != null) bad.push("lastRestockedDate")
      bad.forEach((f) =>
        ctx.addIssue({
          path: [f as string],
          code: z.ZodIssueCode.custom,
          message: "Not allowed for inventory",
        }),
      )
    } else if (data.type === "consumable") {
      const bad: Array<keyof typeof data> = []
      if (data.warrantyExpiry != null) bad.push("warrantyExpiry")
      if (data.expectedUsefulLife != null) bad.push("expectedUsefulLife")
      if (data.minimumThreshold != null) bad.push("minimumThreshold")
      if (data.replacementCost != null) bad.push("replacementCost")
      bad.forEach((f) =>
        ctx.addIssue({
          path: [f as string],
          code: z.ZodIssueCode.custom,
          message: "Not allowed for consumables",
        }),
      )
    }
  })
}

export const createInventoryItemSchema = refine(z.object(shape))
export const updateInventoryItemSchema = refine(z.object(shape))

export type CreateInventoryItemInput = z.input<typeof createInventoryItemSchema>
export type UpdateInventoryItemInput = z.input<typeof updateInventoryItemSchema>
