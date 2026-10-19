import { DomainError } from '@/domain/errors/domain-error'

export class SizePriceZeroPriceError extends DomainError {
  constructor() {
    super('size_price.zero_price', 'A size price must be greater than zero')
  }
}
