import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SizePriceConflictError } from '@/application/errors/size-price-conflict.error'
import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import type { Size } from '@/domain/value-objects/size'
import { PgSizePriceRepository } from '@/infrastructure/database/postgresql/pg-size-price-repository'
import { present } from '@test/integration/fixtures'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgSizePriceRepository', () => {
  const repository = new PgSizePriceRepository(useTestDatabase())

  const january = new Date('2026-01-01T03:00:00Z')
  const february = new Date('2026-02-01T03:00:00Z')
  const march = new Date('2026-03-01T03:00:00Z')

  const price = (size: Size, cents: number, validFrom: Date, validTo: Date | null = null) =>
    SizePriceEntity.restore({
      id: randomUUID(),
      size,
      price: MoneyVO.fromCents(cents),
      validFrom,
      validTo,
    })

  it('finds the open price of a size', async () => {
    const medium = price('medium', 2500, january)
    await repository.create(medium)
    await repository.create(price('large', 3000, january))

    expect(await repository.findOpenBySize('medium')).toEqual(medium)
    expect(await repository.findOpenBySize('small')).toBeNull()
  })

  it('finds the price valid at an instant', async () => {
    const old = price('medium', 2000, january, february)
    const current = price('medium', 2500, february)
    await repository.create(old)
    await repository.create(current)

    expect(await repository.findValidAt('medium', new Date('2026-01-15T12:00:00Z'))).toEqual(old)
    expect(await repository.findValidAt('medium', february)).toEqual(current)
    expect(await repository.findValidAt('medium', new Date('2025-12-31T12:00:00Z'))).toBeNull()
  })

  it('rejects a second open price for the same size', async () => {
    await repository.create(price('medium', 2500, january))

    await expect(repository.create(price('medium', 2600, march))).rejects.toBeInstanceOf(
      SizePriceConflictError,
    )
  })

  it('rejects overlapping validity periods', async () => {
    await repository.create(price('medium', 2000, january, march))

    await expect(repository.create(price('medium', 2500, february))).rejects.toBeInstanceOf(
      SizePriceConflictError,
    )
  })

  it('accepts a price starting exactly when the previous one ends', async () => {
    await repository.create(price('medium', 2000, january, february))

    await expect(repository.create(price('medium', 2500, february))).resolves.toBeUndefined()
  })

  it('closes the open price without rewriting it', async () => {
    const medium = price('medium', 2500, january)
    await repository.create(medium)

    medium.close(february)
    await repository.close(medium)

    expect(await repository.findOpenBySize('medium')).toBeNull()
    expect(await repository.findValidAt('medium', january)).toEqual(medium)
  })

  it('rejects closing a copy read before the price was closed', async () => {
    const current = price('medium', 2500, january)
    await repository.create(current)
    const stale = present(await repository.findOpenBySize('medium'))

    current.close(march)
    await repository.close(current)
    stale.close(february)

    await expect(repository.close(stale)).rejects.toBeInstanceOf(StaleWriteError)
    expect(await repository.findValidAt('medium', february)).toEqual(current)
  })

  it('refuses to store an open price as closed', async () => {
    const medium = price('medium', 2500, january)
    await repository.create(medium)

    await expect(repository.close(medium)).rejects.toBeInstanceOf(TypeError)
    expect(await repository.findOpenBySize('medium')).toEqual(medium)
  })

  it('persists the largest safe integer', async () => {
    const large = price('large', Number.MAX_SAFE_INTEGER, january)
    await repository.create(large)

    expect(await repository.findOpenBySize('large')).toEqual(large)
  })
})
