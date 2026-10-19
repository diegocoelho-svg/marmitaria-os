import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DishEntity } from '@/domain/entities/dish-entity'
import { DrizzleUnitOfWork } from '@/infrastructure/database/postgresql/drizzle-unit-of-work'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'
import { useTestDatabase } from '@test/integration/test-database'

describe('DrizzleUnitOfWork', () => {
  const db = useTestDatabase()
  const unitOfWork = new DrizzleUnitOfWork(db)
  const dishes = new PgDishRepository(db)

  const dish = (name: string) => DishEntity.create({ id: randomUUID(), name })

  it('commits the work and returns its result', async () => {
    const frango = dish('Frango grelhado')

    const result = await unitOfWork.run(async (repositories) => {
      await repositories.dishes.create(frango)

      return frango.id
    })

    expect(result).toBe(frango.id)
    expect(await dishes.findById(frango.id)).toEqual(frango)
  })

  it('rolls back every write when the work fails', async () => {
    const frango = dish('Frango grelhado')
    const bife = dish('Bife acebolado')
    const failure = new Error('second write failed')

    await expect(
      unitOfWork.run(async (repositories) => {
        await repositories.dishes.create(frango)
        await repositories.dishes.create(bife)
        throw failure
      }),
    ).rejects.toBe(failure)

    expect(await dishes.findByIds([frango.id, bife.id])).toEqual([])
  })
})
