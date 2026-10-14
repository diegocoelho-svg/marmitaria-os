import { describe, expect, it } from 'vitest'
import { Money } from '../../../src/domain/value-objects/money'

describe('Money', () => {
  it.each([-1, 10.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects %s cents',
    (cents) => {
      expect(() => Money.fromCents(cents)).toThrow(
        expect.objectContaining({ code: 'money.invalid_amount' }),
      )
    },
  )

  it('adds and multiplies without mutating the operands', () => {
    const price = Money.fromCents(2200)

    expect(price.add(Money.fromCents(150)).cents).toBe(2350)
    expect(price.multiply(3).cents).toBe(6600)
    expect(price.multiply(0).isZero()).toBe(true)
    expect(price.cents).toBe(2200)
  })

  it('rejects invalid factors', () => {
    expect(() => Money.fromCents(100).multiply(1.5)).toThrow(
      expect.objectContaining({ code: 'money.invalid_factor' }),
    )
    expect(() => Money.fromCents(100).multiply(-1)).toThrow(
      expect.objectContaining({ code: 'money.invalid_factor' }),
    )
  })

  it('rejects results beyond the safe integer range', () => {
    const huge = Money.fromCents(Number.MAX_SAFE_INTEGER)

    expect(() => huge.add(Money.fromCents(1))).toThrow(
      expect.objectContaining({ code: 'money.invalid_amount' }),
    )
    expect(() => huge.multiply(2)).toThrow(
      expect.objectContaining({ code: 'money.invalid_amount' }),
    )
  })

  it('compares by value', () => {
    expect(Money.fromCents(500).equals(Money.fromCents(500))).toBe(true)
    expect(Money.fromCents(500).equals(Money.fromCents(501))).toBe(false)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(Money.fromCents(500))).toBe(true)
    expect(Object.isFrozen(Money.zero())).toBe(true)
  })
})
