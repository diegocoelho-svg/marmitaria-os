import { DomainError } from './domain-error'

export class OrderTimeWentBackwardsError extends DomainError {
  constructor() {
    super('order.time_went_backwards', 'Order changes must move forward in time')
  }
}
