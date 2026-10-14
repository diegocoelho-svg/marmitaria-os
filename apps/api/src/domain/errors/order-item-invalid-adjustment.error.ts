import { DomainError } from './domain-error'

export class OrderItemInvalidAdjustmentError extends DomainError {
  constructor(maxLength: number) {
    super(
      'order_item.invalid_adjustment',
      `Adjustment label must have between 1 and ${maxLength} characters`,
    )
  }
}
