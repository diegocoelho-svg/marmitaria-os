import { OrderItemDuplicateAdjustmentError } from '@/domain/errors/order-item-duplicate-adjustment.error'
import { OrderItemInvalidAdjustmentError } from '@/domain/errors/order-item-invalid-adjustment.error'
import { OrderItemInvalidDishNameError } from '@/domain/errors/order-item-invalid-dish-name.error'
import { OrderItemInvalidNoteError } from '@/domain/errors/order-item-invalid-note.error'
import { OrderItemInvalidQuantityError } from '@/domain/errors/order-item-invalid-quantity.error'
import { OrderItemZeroPriceError } from '@/domain/errors/order-item-zero-price.error'
import { optionalText, requiredText } from '@/domain/shared/text'
import type { MoneyVO } from '@/domain/value-objects/money-vo'
import { assertSize, type Size } from '@/domain/value-objects/size'

const DISH_NAME_MAX_LENGTH = 80
const ADJUSTMENT_LABEL_MAX_LENGTH = 60
const NOTE_MAX_LENGTH = 200

export type AdjustmentSnapshot = Readonly<{
  adjustmentId: string
  label: string
}>

export type OrderItemInput = {
  dishId: string
  dishName: string
  size: Size
  unitPrice: MoneyVO
  quantity: number
  adjustments?: readonly AdjustmentSnapshot[] | undefined
  note?: string | undefined
}

export class OrderItemVO {
  private constructor(
    readonly dishId: string,
    readonly dishName: string,
    readonly size: Size,
    readonly unitPrice: MoneyVO,
    readonly quantity: number,
    private readonly adjustmentSnapshots: readonly AdjustmentSnapshot[],
    readonly note: string | undefined,
  ) {
    Object.freeze(this.adjustmentSnapshots)
    Object.freeze(this)
  }

  static create(input: OrderItemInput): OrderItemVO {
    if (input.unitPrice.isZero()) {
      throw new OrderItemZeroPriceError()
    }

    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
      throw new OrderItemInvalidQuantityError(input.quantity)
    }

    input.unitPrice.multiply(input.quantity)

    return new OrderItemVO(
      input.dishId,
      requiredText(input.dishName, DISH_NAME_MAX_LENGTH, OrderItemInvalidDishNameError),
      assertSize(input.size),
      input.unitPrice,
      input.quantity,
      adjustmentSnapshots(input.adjustments ?? []),
      optionalText(input.note, NOTE_MAX_LENGTH, OrderItemInvalidNoteError),
    )
  }

  get adjustments(): readonly AdjustmentSnapshot[] {
    return [...this.adjustmentSnapshots]
  }

  subtotal(): MoneyVO {
    return this.unitPrice.multiply(this.quantity)
  }
}

function adjustmentSnapshots(adjustments: readonly AdjustmentSnapshot[]): AdjustmentSnapshot[] {
  const ids = new Set(adjustments.map((adjustment) => adjustment.adjustmentId))

  if (ids.size !== adjustments.length) {
    throw new OrderItemDuplicateAdjustmentError()
  }

  return adjustments.map((adjustment) =>
    Object.freeze({
      adjustmentId: adjustment.adjustmentId,
      label: requiredText(
        adjustment.label,
        ADJUSTMENT_LABEL_MAX_LENGTH,
        OrderItemInvalidAdjustmentError,
      ),
    }),
  )
}
