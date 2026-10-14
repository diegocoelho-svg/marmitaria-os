import { describe, expect, it } from 'vitest'
import { Money } from '../../../src/domain/value-objects/money'
import { OrderItem } from '../../../src/domain/value-objects/order-item'

const base = {
  dishId: 'frango',
  dishName: 'Frango grelhado',
  size: 'large',
  unitPrice: Money.fromCents(2200),
  quantity: 1,
} as const

describe('OrderItem', () => {
  it('computes the subtotal from the frozen unit price', () => {
    expect(OrderItem.create({ ...base, quantity: 3 }).subtotal().cents).toBe(6600)
  })

  it.each([0, -1, 1.5])('rejects quantity %s', (quantity) => {
    expect(() => OrderItem.create({ ...base, quantity })).toThrow(
      expect.objectContaining({ code: 'order_item.invalid_quantity' }),
    )
  })

  it('rejects a subtotal beyond the safe integer range', () => {
    expect(() =>
      OrderItem.create({
        ...base,
        unitPrice: Money.fromCents(2),
        quantity: Number.MAX_SAFE_INTEGER,
      }),
    ).toThrow(expect.objectContaining({ code: 'money.invalid_amount' }))
  })

  it('rejects a zero price', () => {
    expect(() => OrderItem.create({ ...base, unitPrice: Money.zero() })).toThrow(
      expect.objectContaining({ code: 'order_item.zero_price' }),
    )
  })

  it('normalizes the note and adjustment labels', () => {
    const item = OrderItem.create({
      ...base,
      adjustments: [{ adjustmentId: 'sem-farofa', label: '  Sem farofa ' }],
      note: '   ',
    })

    expect(item.adjustments).toEqual([{ adjustmentId: 'sem-farofa', label: 'Sem farofa' }])
    expect(item.note).toBeUndefined()
  })

  it('rejects a repeated adjustment', () => {
    expect(() =>
      OrderItem.create({
        ...base,
        adjustments: [
          { adjustmentId: 'sem-farofa', label: 'Sem farofa' },
          { adjustmentId: 'sem-farofa', label: 'Sem farofa' },
        ],
      }),
    ).toThrow(expect.objectContaining({ code: 'order_item.duplicate_adjustment' }))
  })

  it('rejects a note longer than 200 characters', () => {
    expect(() => OrderItem.create({ ...base, note: 'x'.repeat(201) })).toThrow(
      expect.objectContaining({ code: 'order_item.invalid_note' }),
    )
  })

  it('keeps its adjustments isolated from callers', () => {
    const adjustments = [{ adjustmentId: 'sem-farofa', label: 'Sem farofa' }]
    const item = OrderItem.create({ ...base, adjustments })

    adjustments.push({ adjustmentId: 'sem-feijao', label: 'Sem feijão' })
    ;(item.adjustments as unknown[]).pop()

    expect(item.adjustments).toHaveLength(1)
    expect(Object.isFrozen(item.adjustments[0])).toBe(true)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(OrderItem.create(base))).toBe(true)
  })
})
