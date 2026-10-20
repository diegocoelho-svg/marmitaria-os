import type { OrderOrigin } from '@/domain/entities/order-entity'
import type { Size } from '@/domain/value-objects/size'

export type CreateOrderItemInput = {
  dishId: string
  size: Size
  quantity: number
  adjustmentIds?: readonly string[] | undefined
  note?: string | undefined
}

export type CreateOrderInput = {
  origin: OrderOrigin
  customerName?: string | undefined
  items: readonly CreateOrderItemInput[]
}
