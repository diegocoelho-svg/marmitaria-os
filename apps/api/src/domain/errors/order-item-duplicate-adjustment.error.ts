import { DomainError } from './domain-error'

export class OrderItemDuplicateAdjustmentError extends DomainError {
  constructor() {
    super('order_item.duplicate_adjustment', 'An item cannot repeat an adjustment')
  }
}
