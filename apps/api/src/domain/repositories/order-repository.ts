import type { OrderEntity } from '@/domain/entities/order-entity'
import type { OrderStatus } from '@/domain/value-objects/order-status'

export interface OrderRepository {
  findById(id: string): Promise<OrderEntity | null>
  create(order: OrderEntity): Promise<void>
  update(order: OrderEntity, expectedStatus: OrderStatus): Promise<void>
}
