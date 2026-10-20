import { z } from 'zod'
import { uuidSchema } from './common'

export const menuSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  dishIds: z.array(z.uuid()),
  archivedAt: z.iso.datetime().nullable(),
})

export const createMenuBodySchema = z.object({
  name: z.string(),
  dishIds: z.array(uuidSchema),
})

export const updateMenuBodySchema = z.object({
  name: z.string().optional(),
  dishIds: z.array(uuidSchema).optional(),
})

export type Menu = z.infer<typeof menuSchema>
export type CreateMenuBody = z.infer<typeof createMenuBodySchema>
export type UpdateMenuBody = z.infer<typeof updateMenuBodySchema>
