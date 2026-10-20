import { and, eq, gt, isNull, lte, or } from 'drizzle-orm'
import { SizePriceConflictError } from '@/application/errors/size-price-conflict.error'
import type { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import type { SizePriceRepository } from '@/domain/repositories/size-price-repository'
import type { Size } from '@/domain/value-objects/size'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { violatesConstraint } from '@/infrastructure/database/postgresql/errors/constraint-violation'
import { SizePriceMapper } from '@/infrastructure/database/postgresql/mappers/size-price-mapper'
import { sizePrices } from '@/infrastructure/database/postgresql/schema'

const PERIOD_CONSTRAINTS = ['size_prices_open_size_unique', 'size_prices_no_overlap']

export class PgSizePriceRepository implements SizePriceRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findValidAt(size: Size, at: Date): Promise<SizePriceEntity | null> {
    const [row] = await this.db
      .select()
      .from(sizePrices)
      .where(
        and(
          eq(sizePrices.size, size),
          lte(sizePrices.validFrom, at),
          or(isNull(sizePrices.validTo), gt(sizePrices.validTo, at)),
        ),
      )

    return row ? SizePriceMapper.fromPersistence(row) : null
  }

  async findOpenBySize(size: Size): Promise<SizePriceEntity | null> {
    const [row] = await this.db
      .select()
      .from(sizePrices)
      .where(and(eq(sizePrices.size, size), isNull(sizePrices.validTo)))

    return row ? SizePriceMapper.fromPersistence(row) : null
  }

  async create(price: SizePriceEntity): Promise<void> {
    try {
      await this.db.insert(sizePrices).values(SizePriceMapper.toPersistence(price))
    } catch (error) {
      if (
        error instanceof Error &&
        PERIOD_CONSTRAINTS.some((constraint) => violatesConstraint(error, constraint))
      ) {
        throw new SizePriceConflictError(price.size)
      }

      throw error
    }
  }

  async close(price: SizePriceEntity): Promise<void> {
    const { validTo } = price

    if (validTo === null) {
      throw new TypeError('Only a closed size price can be stored as closed')
    }

    const updated = await this.db
      .update(sizePrices)
      .set({ validTo })
      .where(and(eq(sizePrices.id, price.id), isNull(sizePrices.validTo)))
      .returning({ id: sizePrices.id })

    if (updated.length === 0) {
      throw new StaleWriteError('SizePrice', price.id)
    }
  }
}
