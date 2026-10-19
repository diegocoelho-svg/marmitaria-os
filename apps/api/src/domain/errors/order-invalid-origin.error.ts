import { DomainError } from '@/domain/errors/domain-error'

export class OrderInvalidOriginError extends DomainError {
  constructor(origin: string) {
    super('order.invalid_origin', `Invalid order origin: ${origin}`)
  }
}
