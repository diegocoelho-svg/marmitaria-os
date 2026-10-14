import { DomainError } from './domain-error'

export class SizePriceAlreadyClosedError extends DomainError {
  constructor() {
    super('size_price.already_closed', 'Price is already closed')
  }
}
