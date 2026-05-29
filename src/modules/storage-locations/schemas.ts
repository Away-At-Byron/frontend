import { z } from "zod"

const name = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Keep it under 80 characters")

const shape = { name }

export const createStorageLocationSchema = z.object(shape)
export const updateStorageLocationSchema = z.object(shape)

export type CreateStorageLocationInput = z.input<
  typeof createStorageLocationSchema
>
export type UpdateStorageLocationInput = z.input<
  typeof updateStorageLocationSchema
>
