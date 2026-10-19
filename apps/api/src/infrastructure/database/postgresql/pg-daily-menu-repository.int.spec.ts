import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { PgDailyMenuRepository } from '@/infrastructure/database/postgresql/pg-daily-menu-repository'
import { PgMenuRepository } from '@/infrastructure/database/postgresql/pg-menu-repository'
import { seedDish, violates } from '@test/integration/fixtures'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgDailyMenuRepository', () => {
  const db = useTestDatabase()
  const repository = new PgDailyMenuRepository(db)
  const menus = new PgMenuRepository(db)
  const now = new Date('2026-10-17T15:00:00Z')
  const date = LocalDateVO.parse('2026-10-20')
  let cardapioA: MenuEntity
  let cardapioB: MenuEntity

  beforeEach(async () => {
    const frango = await seedDish(db, 'Frango grelhado')
    const bife = await seedDish(db, 'Bife acebolado')
    const peixe = await seedDish(db, 'Peixe assado')
    cardapioA = MenuEntity.create({ id: randomUUID(), name: 'Cardápio A', dishIds: [bife, frango] })
    cardapioB = MenuEntity.create({ id: randomUUID(), name: 'Cardápio B', dishIds: [peixe] })
    await menus.create(cardapioA)
    await menus.create(cardapioB)
  })

  const publish = () => DailyMenuEntity.fromMenu({ id: randomUUID(), date, menu: cardapioA, now })

  it('round-trips a daily menu by id and by date', async () => {
    const dailyMenu = publish()
    dailyMenu.pullEvents()

    await repository.create(dailyMenu)

    expect(await repository.findById(dailyMenu.id)).toEqual(dailyMenu)
    expect(await repository.findByDate(date)).toEqual(dailyMenu)
    expect(await repository.findByDate(LocalDateVO.parse('2026-10-21'))).toBeNull()
  })

  it('rejects a second daily menu for the same date', async () => {
    await repository.create(publish())

    await expect(repository.create(publish())).rejects.toMatchObject(
      violates('daily_menus_date_unique'),
    )
  })

  it('persists a new source menu and its dishes', async () => {
    const dailyMenu = publish()
    await repository.create(dailyMenu)

    dailyMenu.applyMenu(cardapioB, now)
    dailyMenu.pullEvents()
    await repository.update(dailyMenu)

    expect(await repository.findById(dailyMenu.id)).toEqual(dailyMenu)
  })

  it('persists dishes adjusted only for the day', async () => {
    const dailyMenu = publish()
    await repository.create(dailyMenu)

    dailyMenu.setDishes([...cardapioB.dishIds, ...cardapioA.dishIds], now)
    dailyMenu.pullEvents()
    await repository.update(dailyMenu)

    expect(await repository.findById(dailyMenu.id)).toEqual(dailyMenu)
  })
})
