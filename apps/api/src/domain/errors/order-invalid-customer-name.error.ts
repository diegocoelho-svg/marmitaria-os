import { DomainError } from '@/domain/errors/domain-error'

export class OrderInvalidCustomerNameError extends DomainError {
  constructor(maxLength: number) {
    super('order.invalid_customer_name', `Customer name must have at most ${maxLength} characters`)
  }
}
