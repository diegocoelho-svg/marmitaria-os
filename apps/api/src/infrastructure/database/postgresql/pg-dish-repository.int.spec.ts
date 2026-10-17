import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DishEntity } from '@/domain/entities/dish-entity'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgDishRepository', () => {
  const repository = new PgDishRepository(useTestDatabase())

  const dish = (name: string, description?: string) =>
    DishEntity.create({ id: randomUUID(), name, description })

  it('round-trips a dish', async () => {
    const frango = dish('Frango grelhado', 'Com legumes')

    await repository.create(frango)

    expect(await repository.findById(frango.id)).toEqual(frango)
  })

  it('returns null for an unknown id', async () => {
    expect(await repository.findById(randomUUID())).toBeNull()
  })

  it('finds by ids ignoring the unknown ones', async () => {
    const frango = dish('Frango grelhado')
    const bife = dish('Bife acebolado')
    await repository.create(frango)
    await repository.create(bife)

    const found = await repository.findByIds([bife.id, randomUUID()])

    expect(found).toEqual([bife])
    expect(await repository.findByIds([])).toEqual([])
  })

  it('lists all dishes by name', async () => {
    const frango = dish('Frango grelhado')
    const bife = dish('Bife acebolado')
    await repository.create(frango)
    await repository.create(bife)

    expect(await repository.findAll()).toEqual([bife, frango])
  })

  it('persists renaming, description and deactivation', async () => {
    const frango = dish('Frango grelhado', 'Com legumes')
    await repository.create(frango)

    frango.rename('Frango assado')
    frango.describe(undefined)
    frango.deactivate()
    await repository.update(frango)

    expect(await repository.findById(frango.id)).toEqual(frango)
  })
})
