import { DomainError } from '../errors/domain-error'

export class Money {
  private constructor(readonly cents: number) {
    Object.freeze(this)
  }

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new DomainError('money.invalid_amount', `Invalid amount in cents: ${cents}`)
    }

    return new Money(cents)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents)
  }

  multiply(factor: number): Money {
    if (!Number.isSafeInteger(factor) || factor < 0) {
      throw new DomainError('money.invalid_factor', `Invalid factor: ${factor}`)
    }

    return Money.fromCents(this.cents * factor)
  }

  isZero(): boolean {
    return this.cents === 0
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }
}
