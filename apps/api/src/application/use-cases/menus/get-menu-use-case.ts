import { MenuOutput } from '@/application/dtos/menus/menu-output'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import type { MenuRepository } from '@/domain/repositories/menu-repository'

export class GetMenuUseCase {
  constructor(private readonly menus: MenuRepository) {}

  async execute(input: { id: string }): Promise<MenuOutput> {
    const menu = await this.menus.findById(input.id)

    if (!menu) {
      throw new MenuNotFoundError(input.id)
    }

    return MenuOutput.from(menu)
  }
}
