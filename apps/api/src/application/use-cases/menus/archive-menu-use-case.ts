import { MenuOutput } from '@/application/dtos/menus/menu-output'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import type { Clock } from '@/application/ports/clock'
import type { MenuRepository } from '@/domain/repositories/menu-repository'

export class ArchiveMenuUseCase {
  constructor(
    private readonly menus: MenuRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { id: string }): Promise<MenuOutput> {
    const menu = await this.menus.findById(input.id)

    if (!menu) {
      throw new MenuNotFoundError(input.id)
    }

    if (!menu.isArchived) {
      menu.archive(this.clock.now())
      await this.menus.update(menu)
    }

    return MenuOutput.from(menu)
  }
}
