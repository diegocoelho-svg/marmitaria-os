import { SizePriceAlreadyClosedError } from '@/domain/errors/size-price-already-closed.error'
import { SizePriceInvalidPeriodError } from '@/domain/errors/size-price-invalid-period.error'
import { SizePriceZeroPriceError } from '@/domain/errors/size-price-zero-price.error'
import { Entity } from '@/domain/shared/entity'
import { copyInstant, toTimestamp } from '@/domain/shared/instant'
import type { MoneyVO } from '@/domain/value-objects/money-vo'
import { assertSize, type Size } from '@/domain/value-objects/size'

export type SizePriceEntityProps = {
  readonly size: Size
  readonly price: MoneyVO
  readonly validFrom: Date
  validTo: Date | null
}

export type CreateSizePriceInput = {
  id: string
  size: Size
  price: MoneyVO
  validFrom: Date
}

export type RestoreSizePriceInput = Omit<CreateSizePriceInput, 'size'> & {
  size: string
  validTo: Date | null
}

export class SizePriceEntity extends Entity<SizePriceEntityProps> {
  private constructor(
    id: string,
    size: string,
    price: MoneyVO,
    validFrom: Date,
    validTo: Date | null,
  ) {
    if (price.isZero()) {
      throw new SizePriceZeroPriceError()
    }

    super(id, {
      size: assertSize(size),
      price,
      validFrom: copyInstant(validFrom),
      validTo: validTo === null ? null : copyInstant(validTo),
    })

    if (this.props.validTo !== null && !this.endsAfterStart(this.props.validTo)) {
      throw new SizePriceInvalidPeriodError()
    }
  }

  static create(input: CreateSizePriceInput): SizePriceEntity {
    return new SizePriceEntity(input.id, input.size, input.price, input.validFrom, null)
  }

  static restore(input: RestoreSizePriceInput): SizePriceEntity {
    return new SizePriceEntity(input.id, input.size, input.price, input.validFrom, input.validTo)
  }

  get size(): Size {
    return this.props.size
  }

  get price(): MoneyVO {
    return this.props.price
  }

  get validFrom(): Date {
    return new Date(this.props.validFrom)
  }

  get validTo(): Date | null {
    return this.props.validTo === null ? null : new Date(this.props.validTo)
  }

  get isOpen(): boolean {
    return this.props.validTo === null
  }

  close(at: Date): void {
    if (this.props.validTo !== null) {
      throw new SizePriceAlreadyClosedError()
    }

    const closedAt = copyInstant(at)

    if (!this.endsAfterStart(closedAt)) {
      throw new SizePriceInvalidPeriodError()
    }

    this.props.validTo = closedAt
  }

  isValidAt(instant: Date): boolean {
    const at = toTimestamp(instant)

    return (
      at >= this.props.validFrom.getTime() &&
      (this.props.validTo === null || at < this.props.validTo.getTime())
    )
  }

  private endsAfterStart(validTo: Date): boolean {
    return validTo.getTime() > this.props.validFrom.getTime()
  }
}
