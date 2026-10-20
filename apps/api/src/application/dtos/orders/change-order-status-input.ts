import type { OrderStatus } from '@/domain/value-objects/order-status'

export type OrderStatusChange = Exclude<OrderStatus, 'received'>

export type ChangeOrderStatusInput = {
  id: string
  status: OrderStatusChange
}
