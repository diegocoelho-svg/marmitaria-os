import type { OrderStatus } from '@/domain/value-objects/order-status'

export type ListOrdersInput = {
  date?: string | undefined
  status?: readonly OrderStatus[] | undefined
}
