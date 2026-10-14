import { describe, expect, it } from 'vitest'
import { MoneyInvalidAmountError } from '../../../src/domain/errors/money-invalid-amount.error'
import { OrderItemDuplicateAdjustmentError } from '../../../src/domain/errors/order-item-duplicate-adjustment.error'
import { OrderItemInvalidNoteError } from '../../../src/domain/errors/order-item-invalid-note.error'
import { OrderItemInvalidQuantityError } from '../../../src/domain/errors/order-item-invalid-quantity.error'
import { OrderItemZeroPriceError } from '../../../src/domain/errors/order-item-zero-price.error'
import { MoneyVO } from '../../../src/domain/value-objects/money-vo'
import { OrderItemVO, type OrderItemInput } from '../../../src/domain/value-objects/order-item-vo'

const base = {
  dishId: 'frango',
  dishName: 'Frango grelhado',
  size: 'large',
  unitPrice: MoneyVO.fromCents(2200),
  quantity: 1,
} satisfies OrderItemInput

describe('OrderItemVO', () => {
  it('computes the subtotal from the frozen unit price', () => {
    expect(OrderItemVO.create({ ...base, quantity: 3 }).subtotal().cents).toBe(6600)
  })

  it.each([0, -1, 1.5])('rejects quantity %s', (quantity) => {
    expect(() => OrderItemVO.create({ ...base, quantity })).toThrow(OrderItemInvalidQuantityError)
  })

  it('rejects a subtotal beyond the safe integer range', () => {
    expect(() =>
      OrderItemVO.create({
        ...base,
        unitPrice: MoneyVO.fromCents(2),
        quantity: Number.MAX_SAFE_INTEGER,
      }),
    ).toThrow(MoneyInvalidAmountError)
  })

  it('rejects a zero price', () => {
    expect(() => OrderItemVO.create({ ...base, unitPrice: MoneyVO.zero() })).toThrow(
      OrderItemZeroPriceError,
    )
  })

  it('normalizes the note and adjustment labels', () => {
    const item = OrderItemVO.create({
      ...base,
      adjustments: [{ adjustmentId: 'sem-farofa', label: '  Sem farofa ' }],
      note: '   ',
    })

    expect(item.adjustments).toEqual([{ adjustmentId: 'sem-farofa', label: 'Sem farofa' }])
    expect(item.note).toBeUndefined()
  })

  it('rejects a repeated adjustment', () => {
    expect(() =>
      OrderItemVO.create({
        ...base,
        adjustments: [
          { adjustmentId: 'sem-farofa', label: 'Sem farofa' },
          { adjustmentId: 'sem-farofa', label: 'Sem farofa' },
        ],
      }),
    ).toThrow(OrderItemDuplicateAdjustmentError)
  })

  it('rejects a note longer than 200 characters', () => {
    expect(() => OrderItemVO.create({ ...base, note: 'x'.repeat(201) })).toThrow(
      OrderItemInvalidNoteError,
    )
  })

  it('keeps its adjustments isolated from callers', () => {
    const adjustments = [{ adjustmentId: 'sem-farofa', label: 'Sem farofa' }]
    const item = OrderItemVO.create({ ...base, adjustments })

    adjustments.push({ adjustmentId: 'sem-feijao', label: 'Sem feijão' })

    expect(item.adjustments).toHaveLength(1)
    expect(item.adjustments).not.toBe(item.adjustments)
    expect(Object.isFrozen(item.adjustments[0])).toBe(true)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(OrderItemVO.create(base))).toBe(true)
  })
})
