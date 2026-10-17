import { DomainError } from '@/domain/errors/domain-error'

export class SizePriceAlreadyClosedError extends DomainError {
  constructor() {
    super('size_price.already_closed', 'Price is already closed')
  }
}
