import { assertSize, type Size } from './size'
import { DomainError } from '../errors/domain-error'
import type { Money } from './money'
import { optionalText, requiredText } from '../shared/text'

const DISH_NAME_MAX_LENGTH = 80
const ADJUSTMENT_LABEL_MAX_LENGTH = 60
const NOTE_MAX_LENGTH = 200

export type AdjustmentSnapshot = Readonly<{
  adjustmentId: string
  label: string
}>

type OrderItemInput = {
  dishId: string
  dishName: string
  size: Size
  unitPrice: Money
  quantity: number
  adjustments?: readonly AdjustmentSnapshot[] | undefined
  note?: string | undefined
}

export class OrderItem {
  readonly #adjustments: readonly AdjustmentSnapshot[]

  private constructor(
    readonly dishId: string,
    readonly dishName: string,
    readonly size: Size,
    readonly unitPrice: Money,
    readonly quantity: number,
    adjustments: readonly AdjustmentSnapshot[],
    readonly note: string | undefined,
  ) {
    this.#adjustments = adjustments
    Object.freeze(this)
  }

  static create(input: OrderItemInput): OrderItem {
    if (input.unitPrice.isZero()) {
      throw new DomainError('order_item.zero_price', 'Item price must be greater than zero')
    }

    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
      throw new DomainError('order_item.invalid_quantity', `Invalid quantity: ${input.quantity}`)
    }

    input.unitPrice.multiply(input.quantity)

    return new OrderItem(
      input.dishId,
      requiredText(input.dishName, DISH_NAME_MAX_LENGTH, 'order_item.invalid_dish_name'),
      assertSize(input.size),
      input.unitPrice,
      input.quantity,
      adjustmentSnapshots(input.adjustments ?? []),
      optionalText(input.note, NOTE_MAX_LENGTH, 'order_item.invalid_note'),
    )
  }

  get adjustments(): readonly AdjustmentSnapshot[] {
    return [...this.#adjustments]
  }

  subtotal(): Money {
    return this.unitPrice.multiply(this.quantity)
  }
}

function adjustmentSnapshots(adjustments: readonly AdjustmentSnapshot[]): AdjustmentSnapshot[] {
  const ids = new Set(adjustments.map((adjustment) => adjustment.adjustmentId))

  if (ids.size !== adjustments.length) {
    throw new DomainError('order_item.duplicate_adjustment', 'An item cannot repeat an adjustment')
  }

  return adjustments.map((adjustment) =>
    Object.freeze({
      adjustmentId: adjustment.adjustmentId,
      label: requiredText(
        adjustment.label,
        ADJUSTMENT_LABEL_MAX_LENGTH,
        'order_item.invalid_adjustment',
      ),
    }),
  )
}
