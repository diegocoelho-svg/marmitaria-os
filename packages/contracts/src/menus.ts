import { z } from 'zod'

export const menuSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  dishIds: z.array(z.uuid()),
  archivedAt: z.iso.datetime().nullable(),
})

export const createMenuBodySchema = z.object({
  name: z.string(),
  dishIds: z.array(z.uuid()),
})

export const updateMenuBodySchema = z.object({
  name: z.string().optional(),
  dishIds: z.array(z.uuid()).optional(),
})

export type Menu = z.infer<typeof menuSchema>
export type CreateMenuBody = z.infer<typeof createMenuBodySchema>
export type UpdateMenuBody = z.infer<typeof updateMenuBodySchema>
