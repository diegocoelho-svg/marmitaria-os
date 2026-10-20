import { beforeEach, describe, expect, it } from 'vitest'
import { DailyMenuNotFoundError } from '@/application/errors/daily-menu-not-found.error'
import { DishUnavailableError } from '@/application/errors/dish-unavailable.error'
import { SetDailyMenuDishesUseCase } from '@/application/use-cases/daily-menus/set-daily-menu-dishes-use-case'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { FakeDailyMenuRepository, FakeDishRepository } from '@test/fakes/fake-repositories'
import { FakeClock, RecordingEventBus } from '@test/fakes/fake-services'

describe('SetDailyMenuDishesUseCase', () => {
  const now = new Date('2026-10-17T15:00:00Z')
  let dailyMenus: FakeDailyMenuRepository
  let eventBus: RecordingEventBus
  let useCase: SetDailyMenuDishesUseCase

  beforeEach(async () => {
    const dishes = new FakeDishRepository()
    dailyMenus = new FakeDailyMenuRepository()
    eventBus = new RecordingEventBus()
    useCase = new SetDailyMenuDishesUseCase(dailyMenus, dishes, new FakeClock(now), eventBus)

    const lasanha = DishEntity.create({ id: 'lasanha', name: 'Lasanha' })
    lasanha.deactivate()
    await dishes.create(DishEntity.create({ id: 'frango', name: 'Frango grelhado' }))
    await dishes.create(DishEntity.create({ id: 'peixe', name: 'Peixe assado' }))
    await dishes.create(lasanha)

    const menu = MenuEntity.create({ id: 'a', name: 'Cardápio A', dishIds: ['frango'] })
    await dailyMenus.create(
      DailyMenuEntity.fromMenu({ id: 'day', date: LocalDateVO.parse('2026-10-17'), menu, now }),
    )
  })

  it('adjusts the dishes of the day and keeps the source menu', async () => {
    const output = await useCase.execute({ date: '2026-10-17', dishIds: ['peixe', 'frango'] })

    expect(output).toEqual({
      id: 'day',
      date: '2026-10-17',
      sourceMenuId: 'a',
      dishIds: ['peixe', 'frango'],
    })
    expect(eventBus.published).toMatchObject([
      { type: 'daily_menu.updated', dishIds: ['peixe', 'frango'] },
    ])
  })

  it('publishes nothing when the dishes do not change', async () => {
    await useCase.execute({ date: '2026-10-17', dishIds: ['frango'] })

    expect(eventBus.published).toEqual([])
  })

  it('rejects unavailable dishes', async () => {
    await expect(
      useCase.execute({ date: '2026-10-17', dishIds: ['frango', 'lasanha'] }),
    ).rejects.toBeInstanceOf(DishUnavailableError)
    expect(await dailyMenus.findById('day')).toMatchObject({ dishIds: ['frango'] })
  })

  it('rejects a date without daily menu', async () => {
    await expect(
      useCase.execute({ date: '2026-10-18', dishIds: ['frango'] }),
    ).rejects.toBeInstanceOf(DailyMenuNotFoundError)
  })
})
