import { MoneyInvalidAmountError } from '../errors/money-invalid-amount.error'
import { MoneyInvalidFactorError } from '../errors/money-invalid-factor.error'

export class MoneyVO {
  private constructor(readonly cents: number) {
    Object.freeze(this)
  }

  static fromCents(cents: number): MoneyVO {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new MoneyInvalidAmountError(cents)
    }

    return new MoneyVO(cents)
  }

  static zero(): MoneyVO {
    return new MoneyVO(0)
  }

  add(other: MoneyVO): MoneyVO {
    return MoneyVO.fromCents(this.cents + other.cents)
  }

  multiply(factor: number): MoneyVO {
    if (!Number.isSafeInteger(factor) || factor < 0) {
      throw new MoneyInvalidFactorError(factor)
    }

    return MoneyVO.fromCents(this.cents * factor)
  }

  isZero(): boolean {
    return this.cents === 0
  }

  equals(other: MoneyVO): boolean {
    return this.cents === other.cents
  }
}
