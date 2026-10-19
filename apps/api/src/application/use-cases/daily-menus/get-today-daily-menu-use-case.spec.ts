import { beforeEach, describe, expect, it } from 'vitest'
import { DailyMenuNotFoundError } from '@/application/errors/daily-menu-not-found.error'
import { GetTodayDailyMenuUseCase } from '@/application/use-cases/daily-menus/get-today-daily-menu-use-case'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { FakeDailyMenuRepository } from '@test/fakes/fake-repositories'
import { FakeClock } from '@test/fakes/fake-services'

describe('GetTodayDailyMenuUseCase', () => {
  let clock: FakeClock
  let useCase: GetTodayDailyMenuUseCase

  beforeEach(async () => {
    const dailyMenus = new FakeDailyMenuRepository()
    clock = new FakeClock(new Date('2026-10-17T15:00:00Z'))
    useCase = new GetTodayDailyMenuUseCase(dailyMenus, clock)

    const menu = MenuEntity.create({ id: 'a', name: 'Cardápio A', dishIds: ['frango'] })
    await dailyMenus.create(
      DailyMenuEntity.fromMenu({
        id: 'day',
        date: LocalDateVO.parse('2026-10-17'),
        menu,
        now: clock.now(),
      }),
    )
  })

  it('finds the daily menu of the local business date', async () => {
    clock.set('2026-10-18T02:59:59Z')

    await expect(useCase.execute()).resolves.toMatchObject({ id: 'day', date: '2026-10-17' })
  })

  it('reports when today has no daily menu', async () => {
    clock.set('2026-10-18T03:00:00Z')

    await expect(useCase.execute()).rejects.toBeInstanceOf(DailyMenuNotFoundError)
  })
})
