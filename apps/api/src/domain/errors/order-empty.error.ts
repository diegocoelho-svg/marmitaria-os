import { DomainError } from '@/domain/errors/domain-error'

export class OrderEmptyError extends DomainError {
  constructor() {
    super('order.empty', 'An order needs at least one item')
  }
}
