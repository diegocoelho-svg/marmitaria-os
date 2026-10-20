import { SizePriceOutput } from '@/application/dtos/size-prices/size-price-output'
import type { SizePriceRepository } from '@/domain/repositories/size-price-repository'
import { sizes } from '@/domain/value-objects/size'

export class ListSizePricesUseCase {
  constructor(private readonly sizePrices: SizePriceRepository) {}

  async execute(): Promise<SizePriceOutput[]> {
    const prices = await Promise.all(sizes.map((size) => this.sizePrices.findOpenBySize(size)))

    return prices.filter((price) => price !== null).map((price) => SizePriceOutput.from(price))
  }
}
