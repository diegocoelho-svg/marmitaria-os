import { DomainError } from '@/domain/errors/domain-error'
import type { OrderStatus } from '@/domain/value-objects/order-status'

export class OrderInconsistentStateError extends DomainError {
  constructor(orderId: string, status: OrderStatus) {
    super(
      'order.inconsistent_state',
      `Order ${orderId} has timestamps inconsistent with status ${status}`,
    )
  }
}
