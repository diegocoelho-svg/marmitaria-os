import { MenuOutput } from '@/application/dtos/menus/menu-output'
import type { MenuRepository } from '@/domain/repositories/menu-repository'

export class ListMenusUseCase {
  constructor(private readonly menus: MenuRepository) {}

  async execute(): Promise<MenuOutput[]> {
    const menus = await this.menus.findAllActive()

    return menus.map((menu) => MenuOutput.from(menu))
  }
}
