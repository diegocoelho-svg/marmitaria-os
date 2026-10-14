import { DomainError } from '../errors/domain-error'

export function dishSelection(dishIds: readonly string[]): string[] {
  if (dishIds.length === 0) {
    throw new DomainError('menu.empty', 'A menu needs at least one dish')
  }

  if (new Set(dishIds).size !== dishIds.length) {
    throw new DomainError('menu.duplicate_dish', 'A menu cannot repeat a dish')
  }

  return [...dishIds]
}

export function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((dishId, index) => dishId === b[index])
}
