import { z } from 'zod'
import { localDateSchema } from './common'

const eventBaseSchema = z.object({
  aggregateId: z.uuid(),
  occurredAt: z.iso.datetime(),
})

export const orderEventSchema = eventBaseSchema.extend({
  type: z.enum([
    'order.created',
    'order.started',
    'order.ready',
    'order.delivered',
    'order.cancelled',
  ]),
  businessDate: localDateSchema,
  ticket: z.number().int(),
})

export const dailyMenuEventSchema = eventBaseSchema.extend({
  type: z.enum(['daily_menu.published', 'daily_menu.updated']),
  date: localDateSchema,
  sourceMenuId: z.uuid(),
  dishIds: z.array(z.uuid()),
})

export const streamEventSchema = z.union([orderEventSchema, dailyMenuEventSchema])

export const streamControlEventSchema = z.enum(['ready', 'reset'])

export type OrderEvent = z.infer<typeof orderEventSchema>
export type DailyMenuEvent = z.infer<typeof dailyMenuEventSchema>
export type StreamEvent = z.infer<typeof streamEventSchema>
export type StreamControlEvent = z.infer<typeof streamControlEventSchema>
