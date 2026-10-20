import { z } from 'zod'

export const dishSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
})

export const createDishBodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export const updateDishBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

export type Dish = z.infer<typeof dishSchema>
export type CreateDishBody = z.infer<typeof createDishBodySchema>
export type UpdateDishBody = z.infer<typeof updateDishBodySchema>
