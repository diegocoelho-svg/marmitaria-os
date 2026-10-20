import type { ChangeSizePriceInput } from '@/application/dtos/size-prices/change-size-price-input'
import { SizePriceOutput } from '@/application/dtos/size-prices/size-price-output'
import type { Clock } from '@/application/ports/clock'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { UnitOfWork } from '@/application/ports/unit-of-work'
import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { MoneyVO } from '@/domain/value-objects/money-vo'

export class ChangeSizePriceUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: ChangeSizePriceInput): Promise<SizePriceOutput> {
    const price = MoneyVO.fromCents(input.priceCents)
    const now = this.clock.now()

    return this.unitOfWork.run(async ({ sizePrices }) => {
      const current = await sizePrices.findOpenBySize(input.size)

      if (current?.price.equals(price)) {
        return SizePriceOutput.from(current)
      }

      const next = SizePriceEntity.create({
        id: this.ids.next(),
        size: input.size,
        price,
        validFrom: now,
      })

      if (current) {
        current.close(now)
        await sizePrices.close(current)
      }

      await sizePrices.create(next)

      return SizePriceOutput.from(next)
    })
  }
}
