import { MenuDuplicateDishError } from '@/domain/errors/menu-duplicate-dish.error'
import { MenuEmptyError } from '@/domain/errors/menu-empty.error'

export class DishSelectionVO {
  private constructor(private readonly ids: readonly string[]) {
    Object.freeze(this.ids)
    Object.freeze(this)
  }

  static of(dishIds: readonly string[]): DishSelectionVO {
    if (dishIds.length === 0) {
      throw new MenuEmptyError()
    }

    if (new Set(dishIds).size !== dishIds.length) {
      throw new MenuDuplicateDishError()
    }

    return new DishSelectionVO([...dishIds])
  }

  get dishIds(): readonly string[] {
    return [...this.ids]
  }

  equals(other: DishSelectionVO): boolean {
    return (
      this.ids.length === other.ids.length &&
      this.ids.every((dishId, index) => dishId === other.ids[index])
    )
  }
}
