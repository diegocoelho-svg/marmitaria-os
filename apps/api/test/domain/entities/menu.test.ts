import { describe, expect, it } from 'vitest'
import { Menu } from '../../../src/domain/entities/menu'

const now = new Date('2026-10-10T12:00:00Z')

function menuD() {
  return Menu.create({ id: 'menu-d', name: 'Cardápio D', dishIds: ['frango', 'lasanha', 'bife'] })
}

describe('Menu', () => {
  it('requires at least one dish without repetition', () => {
    expect(() => Menu.create({ id: 'menu-d', name: 'D', dishIds: [] })).toThrow(
      expect.objectContaining({ code: 'menu.empty' }),
    )
    expect(() => Menu.create({ id: 'menu-d', name: 'D', dishIds: ['frango', 'frango'] })).toThrow(
      expect.objectContaining({ code: 'menu.duplicate_dish' }),
    )
  })

  it('compares names regardless of case', () => {
    expect(menuD().nameKey).toBe(
      Menu.create({ id: 'x', name: 'cardápio d', dishIds: ['a'] }).nameKey,
    )
  })

  it('keeps its selection isolated from callers', () => {
    const dishIds = ['frango', 'lasanha']
    const menu = Menu.create({ id: 'menu-d', name: 'D', dishIds })

    dishIds.push('bife')
    ;(menu.dishIds as string[]).push('bife')

    expect(menu.dishIds).toEqual(['frango', 'lasanha'])
  })

  it('cannot be edited once archived', () => {
    const menu = menuD()
    menu.archive(now)

    expect(() => menu.rename('Novo nome')).toThrow(
      expect.objectContaining({ code: 'menu.archived' }),
    )
    expect(() => menu.setDishes(['frango'])).toThrow(
      expect.objectContaining({ code: 'menu.archived' }),
    )
  })

  it('keeps the first archive date', () => {
    const menu = menuD()

    menu.archive(now)
    menu.archive(new Date('2026-10-20T12:00:00Z'))

    expect(menu.archivedAt).toEqual(now)
  })
})
