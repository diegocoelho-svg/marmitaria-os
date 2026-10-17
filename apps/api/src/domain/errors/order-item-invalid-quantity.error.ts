import { DomainError } from '@/domain/errors/domain-error'

export class OrderItemInvalidQuantityError extends DomainError {
  constructor(quantity: number) {
    super('order_item.invalid_quantity', `Invalid quantity: ${quantity}`)
  }
}
