import { beforeEach, describe, expect, it } from 'vitest'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import { ApplyMenuUseCase } from '@/application/use-cases/daily-menus/apply-menu-use-case'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { DailyMenuPastDateError } from '@/domain/errors/daily-menu-past-date.error'
import { MenuArchivedError } from '@/domain/errors/menu-archived.error'
import { FakeDailyMenuRepository, FakeMenuRepository } from '@test/fakes/fake-repositories'
import { FakeClock, RecordingEventBus, SequentialIdGenerator } from '@test/fakes/fake-services'

describe('ApplyMenuUseCase', () => {
  const now = new Date('2026-10-17T15:00:00Z')
  let dailyMenus: FakeDailyMenuRepository
  let menus: FakeMenuRepository
  let eventBus: RecordingEventBus
  let useCase: ApplyMenuUseCase

  beforeEach(async () => {
    dailyMenus = new FakeDailyMenuRepository()
    menus = new FakeMenuRepository()
    eventBus = new RecordingEventBus()
    useCase = new ApplyMenuUseCase(
      dailyMenus,
      menus,
      new FakeClock(now),
      new SequentialIdGenerator(),
      eventBus,
    )
    await menus.create(MenuEntity.create({ id: 'a', name: 'Cardápio A', dishIds: ['frango'] }))
    await menus.create(MenuEntity.create({ id: 'b', name: 'Cardápio B', dishIds: ['peixe'] }))
  })

  it('publishes the daily menu of a date from a menu', async () => {
    const output = await useCase.execute({ date: '2026-10-20', menuId: 'a' })

    expect(output).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      date: '2026-10-20',
      sourceMenuId: 'a',
      dishIds: ['frango'],
    })
    expect(eventBus.published).toEqual([
      {
        type: 'daily_menu.published',
        aggregateId: output.id,
        occurredAt: now,
        date: '2026-10-20',
        sourceMenuId: 'a',
        dishIds: ['frango'],
      },
    ])
  })

  it('replaces the dishes of an existing daily menu', async () => {
    const published = await useCase.execute({ date: '2026-10-20', menuId: 'a' })

    const output = await useCase.execute({ date: '2026-10-20', menuId: 'b' })

    expect(output).toEqual({ ...published, sourceMenuId: 'b', dishIds: ['peixe'] })
    expect(eventBus.published.map((event) => event.type)).toEqual([
      'daily_menu.published',
      'daily_menu.updated',
    ])
  })

  it('rejects an unknown or archived menu', async () => {
    const archived = MenuEntity.create({ id: 'c', name: 'Cardápio C', dishIds: ['bife'] })
    archived.archive(now)
    await menus.create(archived)

    await expect(useCase.execute({ date: '2026-10-20', menuId: 'z' })).rejects.toBeInstanceOf(
      MenuNotFoundError,
    )
    await expect(useCase.execute({ date: '2026-10-20', menuId: 'c' })).rejects.toBeInstanceOf(
      MenuArchivedError,
    )
    expect(eventBus.published).toEqual([])
  })

  it('rejects a past date', async () => {
    await expect(useCase.execute({ date: '2026-10-16', menuId: 'a' })).rejects.toBeInstanceOf(
      DailyMenuPastDateError,
    )
  })
})
