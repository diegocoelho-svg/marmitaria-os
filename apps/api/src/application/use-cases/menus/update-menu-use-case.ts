import { MenuOutput } from '@/application/dtos/menus/menu-output'
import type { UpdateMenuInput } from '@/application/dtos/menus/update-menu-input'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import { ensureDishesAvailable } from '@/application/services/ensure-dishes-available'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'

export class UpdateMenuUseCase {
  constructor(
    private readonly menus: MenuRepository,
    private readonly dishes: DishRepository,
  ) {}

  async execute(input: UpdateMenuInput): Promise<MenuOutput> {
    const menu = await this.menus.findById(input.id)

    if (!menu) {
      throw new MenuNotFoundError(input.id)
    }

    if (input.name !== undefined) {
      menu.rename(input.name)

      if (await this.menus.existsActiveByNameKey(menu.nameKey, menu.id)) {
        throw new MenuNameTakenError(menu.name)
      }
    }

    if (input.dishIds !== undefined) {
      menu.setDishes(input.dishIds)
      await ensureDishesAvailable(this.dishes, menu.dishIds)
    }

    await this.menus.update(menu)

    return MenuOutput.from(menu)
  }
}
