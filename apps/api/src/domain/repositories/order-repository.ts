import type { OrderEntity } from '@/domain/entities/order-entity'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { OrderStatus } from '@/domain/value-objects/order-status'

export interface OrderRepository {
  findById(id: string): Promise<OrderEntity | null>
  findByBusinessDate(
    businessDate: LocalDateVO,
    statuses?: readonly OrderStatus[] | undefined,
  ): Promise<OrderEntity[]>
  create(order: OrderEntity): Promise<void>
  update(order: OrderEntity, expectedStatus: OrderStatus): Promise<void>
}
