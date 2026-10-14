import { describe, expect, it } from 'vitest'
import { SizePrice } from '../../../src/domain/entities/size-price'
import type { Size } from '../../../src/domain/value-objects/size'
import { Money } from '../../../src/domain/value-objects/money'

const validFrom = new Date('2026-10-01T12:00:00Z')

function largePrice() {
  return SizePrice.create({ id: 'price-1', size: 'large', price: Money.fromCents(2000), validFrom })
}

describe('SizePrice', () => {
  it('starts open', () => {
    const price = largePrice()

    expect(price.isOpen).toBe(true)
    expect(price.validTo).toBeNull()
  })

  it('rejects a zero price', () => {
    expect(() =>
      SizePrice.create({ id: 'price-1', size: 'large', price: Money.zero(), validFrom }),
    ).toThrow(expect.objectContaining({ code: 'size_price.zero_price' }))
  })

  it('rejects an unknown size', () => {
    expect(() =>
      SizePrice.restore({
        id: 'price-1',
        size: 'huge' as Size,
        price: Money.fromCents(2000),
        validFrom,
        validTo: null,
      }),
    ).toThrow(expect.objectContaining({ code: 'size.invalid' }))
  })

  it('is valid from its start until it is closed, exclusive', () => {
    const price = largePrice()
    const closedAt = new Date('2026-10-10T12:00:00Z')

    price.close(closedAt)

    expect(price.isValidAt(new Date('2026-10-01T11:59:59Z'))).toBe(false)
    expect(price.isValidAt(validFrom)).toBe(true)
    expect(price.isValidAt(new Date('2026-10-10T11:59:59Z'))).toBe(true)
    expect(price.isValidAt(closedAt)).toBe(false)
  })

  it('cannot close at or before its start', () => {
    expect(() => largePrice().close(validFrom)).toThrow(
      expect.objectContaining({ code: 'size_price.invalid_period' }),
    )
  })

  it('cannot close twice', () => {
    const price = largePrice()
    price.close(new Date('2026-10-10T12:00:00Z'))

    expect(() => price.close(new Date('2026-10-11T12:00:00Z'))).toThrow(
      expect.objectContaining({ code: 'size_price.already_closed' }),
    )
  })

  it('does not expose its dates for mutation', () => {
    const start = new Date(validFrom)
    const price = SizePrice.create({
      id: 'price-1',
      size: 'large',
      price: Money.fromCents(2000),
      validFrom: start,
    })

    start.setFullYear(2030)
    price.validFrom.setFullYear(2030)

    expect(price.validFrom).toEqual(validFrom)
  })
})
