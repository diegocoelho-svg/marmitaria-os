import { z } from 'zod'
import { localDateSchema, uuidSchema } from './common'

export const dailyMenuSchema = z.object({
  id: z.uuid(),
  date: localDateSchema,
  sourceMenuId: z.uuid(),
  dishIds: z.array(z.uuid()),
})

export const dailyMenuParamsSchema = z.object({
  date: localDateSchema,
})

export const listDailyMenusQuerySchema = z
  .object({
    from: localDateSchema,
    to: localDateSchema,
  })
  .refine(({ from, to }) => from <= to, {
    message: 'from must not be after to',
    path: ['to'],
  })

export const applyMenuBodySchema = z.object({
  menuId: uuidSchema,
})

export const setDailyMenuDishesBodySchema = z.object({
  dishIds: z.array(uuidSchema),
})

export type DailyMenu = z.infer<typeof dailyMenuSchema>
export type ListDailyMenusQuery = z.infer<typeof listDailyMenusQuerySchema>
export type ApplyMenuBody = z.infer<typeof applyMenuBodySchema>
export type SetDailyMenuDishesBody = z.infer<typeof setDailyMenuDishesBodySchema>
