import { describe, expect, it } from 'vitest'
import { SizeInvalidError } from '@/domain/errors/size-invalid.error'
import { SizePriceAlreadyClosedError } from '@/domain/errors/size-price-already-closed.error'
import { SizePriceInvalidPeriodError } from '@/domain/errors/size-price-invalid-period.error'
import { SizePriceZeroPriceError } from '@/domain/errors/size-price-zero-price.error'
import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import type { Size } from '@/domain/value-objects/size'
import { MoneyVO } from '@/domain/value-objects/money-vo'

const validFrom = new Date('2026-10-01T12:00:00Z')

function largePrice() {
  return SizePriceEntity.create({
    id: 'price-1',
    size: 'large',
    price: MoneyVO.fromCents(2000),
    validFrom,
  })
}

describe('SizePriceEntity', () => {
  it('starts open', () => {
    const price = largePrice()

    expect(price.isOpen).toBe(true)
    expect(price.validTo).toBeNull()
  })

  it('rejects a zero price', () => {
    expect(() =>
      SizePriceEntity.create({ id: 'price-1', size: 'large', price: MoneyVO.zero(), validFrom }),
    ).toThrow(SizePriceZeroPriceError)
  })

  it('rejects an unknown size', () => {
    expect(() =>
      SizePriceEntity.restore({
        id: 'price-1',
        size: 'huge' as Size,
        price: MoneyVO.fromCents(2000),
        validFrom,
        validTo: null,
      }),
    ).toThrow(SizeInvalidError)
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
    expect(() => largePrice().close(validFrom)).toThrow(SizePriceInvalidPeriodError)
  })

  it('cannot close twice', () => {
    const price = largePrice()
    price.close(new Date('2026-10-10T12:00:00Z'))

    expect(() => price.close(new Date('2026-10-11T12:00:00Z'))).toThrow(SizePriceAlreadyClosedError)
  })

  it('does not expose its dates for mutation', () => {
    const start = new Date(validFrom)
    const price = SizePriceEntity.create({
      id: 'price-1',
      size: 'large',
      price: MoneyVO.fromCents(2000),
      validFrom: start,
    })

    start.setFullYear(2030)
    price.validFrom.setFullYear(2030)

    expect(price.validFrom).toEqual(validFrom)
  })
})
