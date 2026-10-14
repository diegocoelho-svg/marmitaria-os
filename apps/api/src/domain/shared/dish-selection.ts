import { MenuDuplicateDishError } from '../errors/menu-duplicate-dish.error'
import { MenuEmptyError } from '../errors/menu-empty.error'

export function dishSelection(dishIds: readonly string[]): string[] {
  if (dishIds.length === 0) {
    throw new MenuEmptyError()
  }

  if (new Set(dishIds).size !== dishIds.length) {
    throw new MenuDuplicateDishError()
  }

  return [...dishIds]
}

export function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((dishId, index) => dishId === b[index])
}
