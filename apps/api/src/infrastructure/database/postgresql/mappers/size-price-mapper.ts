import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { sizePrices } from '@/infrastructure/database/postgresql/schema'

type SizePriceRow = typeof sizePrices.$inferSelect

export class SizePriceMapper {
  static fromPersistence(row: SizePriceRow): SizePriceEntity {
    return restoreRecord('size_prices', row.id, () =>
      SizePriceEntity.restore({
        id: row.id,
        size: row.size,
        price: MoneyVO.fromCents(row.priceCents),
        validFrom: row.validFrom,
        validTo: row.validTo,
      }),
    )
  }

  static toPersistence(price: SizePriceEntity): SizePriceRow {
    return {
      id: price.id,
      size: price.size,
      priceCents: price.price.cents,
      validFrom: price.validFrom,
      validTo: price.validTo,
    }
  }
}
