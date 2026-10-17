import { DomainError } from '@/domain/errors/domain-error'

export class MoneyInvalidAmountError extends DomainError {
  constructor(cents: number) {
    super('money.invalid_amount', `Invalid amount in cents: ${cents}`)
  }
}
