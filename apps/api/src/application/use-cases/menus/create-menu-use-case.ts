import type { CreateMenuInput } from '@/application/dtos/menus/create-menu-input'
import { MenuOutput } from '@/application/dtos/menus/menu-output'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import type { IdGenerator } from '@/application/ports/id-generator'
import { ensureDishesAvailable } from '@/application/services/ensure-dishes-available'
import { MenuEntity } from '@/domain/entities/menu-entity'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'

export class CreateMenuUseCase {
  constructor(
    private readonly menus: MenuRepository,
    private readonly dishes: DishRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateMenuInput): Promise<MenuOutput> {
    const menu = MenuEntity.create({
      id: this.ids.next(),
      name: input.name,
      dishIds: input.dishIds,
    })

    if (await this.menus.existsActiveByNameKey(menu.nameKey)) {
      throw new MenuNameTakenError(menu.name)
    }

    await ensureDishesAvailable(this.dishes, menu.dishIds)
    await this.menus.create(menu)

    return MenuOutput.from(menu)
  }
}
