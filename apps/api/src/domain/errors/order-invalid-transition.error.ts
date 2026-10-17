import { DomainError } from '@/domain/errors/domain-error'
import type { OrderStatus } from '@/domain/value-objects/order-status'

export class OrderInvalidTransitionError extends DomainError {
  constructor(from: OrderStatus, to: OrderStatus) {
    super('order.invalid_transition', `Cannot change order from ${from} to ${to}`)
  }
}
