import { describe, expect, it } from 'vitest'
import { DailyMenuPastDateError } from '../../../src/domain/errors/daily-menu-past-date.error'
import { MenuArchivedError } from '../../../src/domain/errors/menu-archived.error'
import { DailyMenuEntity } from '../../../src/domain/entities/daily-menu-entity'
import { MenuEntity } from '../../../src/domain/entities/menu-entity'
import { LocalDateVO } from '../../../src/domain/value-objects/local-date-vo'

const now = new Date('2026-10-10T12:00:00Z')
const today = LocalDateVO.parse('2026-10-10')

function menu(id: string, dishIds: string[]) {
  return MenuEntity.create({ id, name: id, dishIds })
}

function todayFrom(source: MenuEntity) {
  const dailyMenu = DailyMenuEntity.fromMenu({ id: 'day-1', date: today, menu: source, now })
  dailyMenu.pullEvents()
  return dailyMenu
}

describe('DailyMenuEntity', () => {
  it('copies the dishes of the chosen menu and publishes the day', () => {
    const dailyMenu = DailyMenuEntity.fromMenu({
      id: 'day-1',
      date: today,
      menu: menu('menu-d', ['frango', 'lasanha']),
      now,
    })

    expect(dailyMenu.sourceMenuId).toBe('menu-d')
    expect(dailyMenu.dishIds).toEqual(['frango', 'lasanha'])
    expect(dailyMenu.pullEvents()).toEqual([
      {
        type: 'daily_menu.published',
        aggregateId: 'day-1',
        occurredAt: now,
        date: '2026-10-10',
        sourceMenuId: 'menu-d',
        dishIds: ['frango', 'lasanha'],
      },
    ])
    expect(dailyMenu.pullEvents()).toEqual([])
  })

  it('plans future days but rejects past ones', () => {
    const source = menu('menu-d', ['frango'])

    expect(() =>
      DailyMenuEntity.fromMenu({
        id: 'day-1',
        date: LocalDateVO.parse('2026-10-17'),
        menu: source,
        now,
      }),
    ).not.toThrow()
    expect(() =>
      DailyMenuEntity.fromMenu({
        id: 'day-1',
        date: LocalDateVO.parse('2026-10-09'),
        menu: source,
        now,
      }),
    ).toThrow(DailyMenuPastDateError)
  })

  it('rejects an archived menu without changing the day', () => {
    const dailyMenu = todayFrom(menu('menu-d', ['frango']))
    const archived = menu('menu-a', ['bife'])
    archived.archive(now)

    expect(() => dailyMenu.applyMenu(archived, now)).toThrow(MenuArchivedError)
    expect(dailyMenu.sourceMenuId).toBe('menu-d')
    expect(dailyMenu.pullEvents()).toEqual([])
  })

  it('is independent from later changes to its source menu', () => {
    const source = menu('menu-d', ['frango', 'lasanha'])
    const dailyMenu = todayFrom(source)

    source.setDishes(['frango', 'strogonoff'])

    expect(dailyMenu.dishIds).toEqual(['frango', 'lasanha'])
  })

  it('adjusts only the day and keeps the source', () => {
    const source = menu('menu-d', ['frango', 'lasanha', 'bife'])
    const dailyMenu = todayFrom(source)

    dailyMenu.setDishes(['frango', 'bife'], now)

    expect(dailyMenu.dishIds).toEqual(['frango', 'bife'])
    expect(dailyMenu.sourceMenuId).toBe('menu-d')
    expect(source.dishIds).toEqual(['frango', 'lasanha', 'bife'])
    expect(dailyMenu.pullEvents()).toMatchObject([
      { type: 'daily_menu.updated', dishIds: ['frango', 'bife'] },
    ])
  })

  it('reapplying a menu replaces local adjustments', () => {
    const source = menu('menu-d', ['frango', 'lasanha'])
    const dailyMenu = todayFrom(source)
    dailyMenu.setDishes(['frango'], now)

    dailyMenu.applyMenu(source, now)

    expect(dailyMenu.dishIds).toEqual(['frango', 'lasanha'])
    expect(dailyMenu.id).toBe('day-1')
  })

  it('records a change of source even with the same dishes', () => {
    const dailyMenu = todayFrom(menu('menu-b', ['frango']))

    dailyMenu.applyMenu(menu('menu-d', ['frango']), now)

    expect(dailyMenu.sourceMenuId).toBe('menu-d')
    expect(dailyMenu.pullEvents()).toMatchObject([{ type: 'daily_menu.updated' }])
  })

  it('records nothing when nothing changes', () => {
    const source = menu('menu-d', ['frango'])
    const dailyMenu = todayFrom(source)

    dailyMenu.applyMenu(source, now)
    dailyMenu.setDishes(['frango'], now)

    expect(dailyMenu.pullEvents()).toEqual([])
  })

  it('keeps recorded events unchanged by later changes', () => {
    const dailyMenu = DailyMenuEntity.fromMenu({
      id: 'day-1',
      date: today,
      menu: menu('menu-d', ['frango']),
      now,
    })

    dailyMenu.setDishes(['bife'], now)

    expect(dailyMenu.pullEvents().map((event) => event.dishIds)).toEqual([['frango'], ['bife']])
  })

  it('restores a past day without its source and rejects changes to it', () => {
    const dailyMenu = DailyMenuEntity.restore({
      id: 'day-0',
      date: LocalDateVO.parse('2026-10-06'),
      sourceMenuId: 'archived-menu',
      dishIds: ['frango'],
    })

    expect(dailyMenu.pullEvents()).toEqual([])
    expect(() => dailyMenu.setDishes(['bife'], now)).toThrow(DailyMenuPastDateError)
  })
})
