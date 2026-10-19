import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { setupRepositories } from '@/infrastructure/bootstrap/setup-repositories'
import { useTestDatabase } from '@test/integration/test-database'

describe('setupRepositories', () => {
  const db = useTestDatabase()

  it('writes through an outer transaction and rolls back with it', async () => {
    const dish = DishEntity.create({ id: randomUUID(), name: 'Frango grelhado' })
    const menu = MenuEntity.create({ id: randomUUID(), name: 'Cardápio A', dishIds: [dish.id] })
    const rollback = new Error('rollback')

    await expect(
      db.transaction(async (tx) => {
        const repositories = setupRepositories(tx)
        await repositories.dishes.create(dish)
        await repositories.menus.create(menu)
        expect(await repositories.menus.findById(menu.id)).toEqual(menu)

        throw rollback
      }),
    ).rejects.toBe(rollback)

    const repositories = setupRepositories(db)
    expect(await repositories.dishes.findById(dish.id)).toBeNull()
    expect(await repositories.menus.findById(menu.id)).toBeNull()
  })
})
