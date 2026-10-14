import { DomainError } from '../errors/domain-error'
import { toTimestamp } from '../shared/instant'
import type { Money } from '../value-objects/money'
import { assertSize, type Size } from '../value-objects/size'

type CreateSizePriceInput = {
  id: string
  size: Size
  price: Money
  validFrom: Date
}

type SizePriceProps = CreateSizePriceInput & {
  validTo: Date | null
}

export class SizePrice {
  readonly size: Size
  readonly #validFrom: number
  #validTo: number | null

  private constructor(
    readonly id: string,
    size: string,
    readonly price: Money,
    validFrom: Date,
    validTo: Date | null,
  ) {
    if (price.isZero()) {
      throw new DomainError('size_price.zero_price', 'A size price must be greater than zero')
    }

    this.size = assertSize(size)
    this.#validFrom = toTimestamp(validFrom)
    this.#validTo = validTo === null ? null : toTimestamp(validTo)

    if (this.#validTo !== null && this.#validTo <= this.#validFrom) {
      throw new DomainError('size_price.invalid_period', 'Price must end after it starts')
    }
  }

  static create(input: CreateSizePriceInput): SizePrice {
    return new SizePrice(input.id, input.size, input.price, input.validFrom, null)
  }

  static restore(props: SizePriceProps): SizePrice {
    return new SizePrice(props.id, props.size, props.price, props.validFrom, props.validTo)
  }

  get validFrom(): Date {
    return new Date(this.#validFrom)
  }

  get validTo(): Date | null {
    return this.#validTo === null ? null : new Date(this.#validTo)
  }

  get isOpen(): boolean {
    return this.#validTo === null
  }

  close(at: Date): void {
    if (this.#validTo !== null) {
      throw new DomainError('size_price.already_closed', 'Price is already closed')
    }

    const closedAt = toTimestamp(at)

    if (closedAt <= this.#validFrom) {
      throw new DomainError('size_price.invalid_period', 'Price must end after it starts')
    }

    this.#validTo = closedAt
  }

  isValidAt(instant: Date): boolean {
    const at = toTimestamp(instant)

    return at >= this.#validFrom && (this.#validTo === null || at < this.#validTo)
  }
}
