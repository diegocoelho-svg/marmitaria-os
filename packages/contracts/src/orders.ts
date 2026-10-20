import { z } from 'zod'
import { localDateSchema, uuidSchema } from './common'
import { sizeSchema } from './size-prices'

export const orderOriginSchema = z.enum(['counter', 'whatsapp'])

export const orderStatusSchema = z.enum([
  'received',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
])

export const orderStatusChangeSchema = orderStatusSchema.exclude(['received'])

export const orderItemSchema = z.object({
  dishId: z.uuid(),
  dishName: z.string(),
  size: sizeSchema,
  unitPriceCents: z.number().int(),
  quantity: z.number().int(),
  subtotalCents: z.number().int(),
  adjustments: z.array(z.object({ adjustmentId: z.uuid(), label: z.string() })),
  note: z.string().nullable(),
})

export const orderSchema = z.object({
  id: z.uuid(),
  businessDate: localDateSchema,
  ticket: z.number().int(),
  origin: orderOriginSchema,
  customerName: z.string().nullable(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  totalCents: z.number().int(),
  createdAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  readyAt: z.iso.datetime().nullable(),
  deliveredAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
})

export const listOrdersQuerySchema = z.object({
  date: localDateSchema.optional(),
  status: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(orderStatusSchema))
    .optional(),
})

export const createOrderBodySchema = z.object({
  origin: orderOriginSchema,
  customerName: z.string().optional(),
  items: z
    .array(
      z.object({
        dishId: uuidSchema,
        size: sizeSchema,
        quantity: z.number().int().positive(),
        adjustmentIds: z.array(uuidSchema).optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
})

export const changeOrderStatusBodySchema = z.object({
  status: orderStatusChangeSchema,
})

export type OrderOrigin = z.infer<typeof orderOriginSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type Order = z.infer<typeof orderSchema>
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>
export type ChangeOrderStatusBody = z.infer<typeof changeOrderStatusBodySchema>
