import { DomainError } from '@/domain/errors/domain-error'

export class SizePriceInvalidPeriodError extends DomainError {
  constructor() {
    super('size_price.invalid_period', 'Price must end after it starts')
  }
}
