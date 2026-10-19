import type { ApplyMenuInput } from '@/application/dtos/daily-menus/apply-menu-input'
import { DailyMenuOutput } from '@/application/dtos/daily-menus/daily-menu-output'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class ApplyMenuUseCase {
  constructor(
    private readonly dailyMenus: DailyMenuRepository,
    private readonly menus: MenuRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ApplyMenuInput): Promise<DailyMenuOutput> {
    const date = LocalDateVO.parse(input.date)
    const now = this.clock.now()
    const menu = await this.menus.findById(input.menuId)

    if (!menu) {
      throw new MenuNotFoundError(input.menuId)
    }

    const existing = await this.dailyMenus.findByDate(date)
    let dailyMenu: DailyMenuEntity

    if (existing) {
      existing.applyMenu(menu, now)
      await this.dailyMenus.update(existing)
      dailyMenu = existing
    } else {
      dailyMenu = DailyMenuEntity.fromMenu({ id: this.ids.next(), date, menu, now })
      await this.dailyMenus.create(dailyMenu)
    }

    await this.eventBus.publish(dailyMenu.pullEvents())

    return DailyMenuOutput.from(dailyMenu)
  }
}
