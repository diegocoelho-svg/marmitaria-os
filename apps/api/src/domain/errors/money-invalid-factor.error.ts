import { DomainError } from '@/domain/errors/domain-error'

export class MoneyInvalidFactorError extends DomainError {
  constructor(factor: number) {
    super('money.invalid_factor', `Invalid factor: ${factor}`)
  }
}
