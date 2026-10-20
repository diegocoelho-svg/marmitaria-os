import type { SizePriceEntity } from '@/domain/entities/size-price-entity'
import type { Size } from '@/domain/value-objects/size'

export type SizePriceOutput = {
  size: Size
  priceCents: number
  validFrom: string
}

export const SizePriceOutput = {
  from(price: SizePriceEntity): SizePriceOutput {
    return {
      size: price.size,
      priceCents: price.price.cents,
      validFrom: price.validFrom.toISOString(),
    }
  },
}
