import { z } from "zod"

/**
 * Zod is the single validation source. The SAME schema is imported by the
 * server action AND the React Hook Form resolver (CLAUDE.md rule 6).
 * Money is integer cents — never float, never decimal (rule 4).
 */
export const createExampleSchema = z.object({
  name: z.string().min(1, "Required").max(120),
  priceCents: z.number().int().nonnegative(),
})

export type CreateExampleInput = z.infer<typeof createExampleSchema>
