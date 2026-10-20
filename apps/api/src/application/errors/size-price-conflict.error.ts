import { ConflictError } from '@/application/errors/application-error'

export class SizePriceConflictError extends ConflictError {
  constructor(size: string) {
    super('size_price.conflict', `The price of size ${size} was changed by another operation`)
  }
}
