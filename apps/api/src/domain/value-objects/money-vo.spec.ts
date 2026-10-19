import { describe, expect, it } from 'vitest'
import { MoneyInvalidAmountError } from '@/domain/errors/money-invalid-amount.error'
import { MoneyInvalidFactorError } from '@/domain/errors/money-invalid-factor.error'
import { MoneyVO } from '@/domain/value-objects/money-vo'

describe('MoneyVO', () => {
  it.each([-1, 10.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %s cents',
    (cents) => {
      expect(() => MoneyVO.fromCents(cents)).toThrow(MoneyInvalidAmountError)
    },
  )

  it('adds and multiplies without mutating the operands', () => {
    const price = MoneyVO.fromCents(2200)

    expect(price.add(MoneyVO.fromCents(150)).cents).toBe(2350)
    expect(price.multiply(3).cents).toBe(6600)
    expect(price.multiply(0).isZero()).toBe(true)
    expect(price.cents).toBe(2200)
  })

  it('rejects invalid factors', () => {
    expect(() => MoneyVO.fromCents(100).multiply(1.5)).toThrow(MoneyInvalidFactorError)
    expect(() => MoneyVO.fromCents(100).multiply(-1)).toThrow(MoneyInvalidFactorError)
  })

  it('rejects results beyond the safe integer range', () => {
    const huge = MoneyVO.fromCents(Number.MAX_SAFE_INTEGER)

    expect(() => huge.add(MoneyVO.fromCents(1))).toThrow(MoneyInvalidAmountError)
    expect(() => huge.multiply(2)).toThrow(MoneyInvalidAmountError)
  })

  it('compares by value', () => {
    expect(MoneyVO.fromCents(500).equals(MoneyVO.fromCents(500))).toBe(true)
    expect(MoneyVO.fromCents(500).equals(MoneyVO.fromCents(501))).toBe(false)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(MoneyVO.fromCents(500))).toBe(true)
    expect(Object.isFrozen(MoneyVO.zero())).toBe(true)
  })
})
