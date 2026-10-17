import { DomainError } from '@/domain/errors/domain-error'

export class OrderInvalidStatusError extends DomainError {
  constructor(status: string) {
    super('order.invalid_status', `Invalid order status: ${status}`)
  }
}
