import { DomainError } from '@/domain/errors/domain-error'

export class OrderItemZeroPriceError extends DomainError {
  constructor() {
    super('order_item.zero_price', 'Item price must be greater than zero')
  }
}
