import { describe, expect, it } from 'vitest'
import { MenuDuplicateDishError } from '@/domain/errors/menu-duplicate-dish.error'
import { MenuEmptyError } from '@/domain/errors/menu-empty.error'
import { DishSelectionVO } from '@/domain/value-objects/dish-selection-vo'

describe('DishSelectionVO', () => {
  it('rejects an empty or repeated selection', () => {
    expect(() => DishSelectionVO.of([])).toThrow(MenuEmptyError)
    expect(() => DishSelectionVO.of(['frango', 'frango'])).toThrow(MenuDuplicateDishError)
  })

  it('compares by dishes and order', () => {
    const selection = DishSelectionVO.of(['frango', 'lasanha'])

    expect(selection.equals(DishSelectionVO.of(['frango', 'lasanha']))).toBe(true)
    expect(selection.equals(DishSelectionVO.of(['lasanha', 'frango']))).toBe(false)
    expect(selection.equals(DishSelectionVO.of(['frango']))).toBe(false)
  })

  it('is immutable and isolated from callers', () => {
    const dishIds = ['frango']
    const selection = DishSelectionVO.of(dishIds)

    dishIds.push('bife')

    expect(selection.dishIds).toEqual(['frango'])
    expect(selection.dishIds).not.toBe(selection.dishIds)
    expect(Object.isFrozen(selection)).toBe(true)
  })
})
