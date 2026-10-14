import { DomainError } from './domain-error'

export class OrderBusinessDateMismatchError extends DomainError {
  constructor() {
    super('order.business_date_mismatch', 'Business date must match the creation date')
  }
}
