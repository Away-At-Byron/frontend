import { z } from "zod"

const name = z.string().trim().min(1, "Required").max(120)
const email = z.string().trim().toLowerCase().email("Enter a valid email")
const phone = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((v) => (v ? v : undefined))

export const createUserSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone,
  roleId: z.string().uuid("Select a role"),
  password: z.string().min(8, "At least 8 characters").max(200),
})

export const updateUserSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone,
  roleId: z.string().uuid("Select a role"),
  status: z.enum(["active", "disabled", "locked"]),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
