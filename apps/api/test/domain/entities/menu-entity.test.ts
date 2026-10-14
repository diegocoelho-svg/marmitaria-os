import { describe, expect, it } from 'vitest'
import { MenuArchivedError } from '../../../src/domain/errors/menu-archived.error'
import { MenuDuplicateDishError } from '../../../src/domain/errors/menu-duplicate-dish.error'
import { MenuEmptyError } from '../../../src/domain/errors/menu-empty.error'
import { MenuEntity } from '../../../src/domain/entities/menu-entity'

const now = new Date('2026-10-10T12:00:00Z')

function menuD() {
  return MenuEntity.create({
    id: 'menu-d',
    name: 'Cardápio D',
    dishIds: ['frango', 'lasanha', 'bife'],
  })
}

describe('MenuEntity', () => {
  it('requires at least one dish without repetition', () => {
    expect(() => MenuEntity.create({ id: 'menu-d', name: 'D', dishIds: [] })).toThrow(
      MenuEmptyError,
    )
    expect(() =>
      MenuEntity.create({ id: 'menu-d', name: 'D', dishIds: ['frango', 'frango'] }),
    ).toThrow(MenuDuplicateDishError)
  })

  it('compares names regardless of case', () => {
    expect(menuD().nameKey).toBe(
      MenuEntity.create({ id: 'x', name: 'cardápio d', dishIds: ['a'] }).nameKey,
    )
  })

  it('keeps its selection isolated from callers', () => {
    const dishIds = ['frango', 'lasanha']
    const menu = MenuEntity.create({ id: 'menu-d', name: 'D', dishIds })

    dishIds.push('bife')
    ;(menu.dishIds as string[]).push('bife')

    expect(menu.dishIds).toEqual(['frango', 'lasanha'])
  })

  it('cannot be edited once archived', () => {
    const menu = menuD()
    menu.archive(now)

    expect(() => menu.rename('Novo nome')).toThrow(MenuArchivedError)
    expect(() => menu.setDishes(['frango'])).toThrow(MenuArchivedError)
  })

  it('keeps the first archive date', () => {
    const menu = menuD()

    menu.archive(now)
    menu.archive(new Date('2026-10-20T12:00:00Z'))

    expect(menu.archivedAt).toEqual(now)
  })
})
