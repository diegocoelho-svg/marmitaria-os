import { DailyMenuOutput } from '@/application/dtos/daily-menus/daily-menu-output'
import type { SetDailyMenuDishesInput } from '@/application/dtos/daily-menus/set-daily-menu-dishes-input'
import { DailyMenuNotFoundError } from '@/application/errors/daily-menu-not-found.error'
import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import { ensureDishesAvailable } from '@/application/services/ensure-dishes-available'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class SetDailyMenuDishesUseCase {
  constructor(
    private readonly dailyMenus: DailyMenuRepository,
    private readonly dishes: DishRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: SetDailyMenuDishesInput): Promise<DailyMenuOutput> {
    const dailyMenu = await this.dailyMenus.findByDate(LocalDateVO.parse(input.date))

    if (!dailyMenu) {
      throw new DailyMenuNotFoundError(input.date)
    }

    dailyMenu.setDishes(input.dishIds, this.clock.now())
    await ensureDishesAvailable(this.dishes, dailyMenu.dishIds)
    await this.dailyMenus.update(dailyMenu)
    await this.eventBus.publish(dailyMenu.pullEvents())

    return DailyMenuOutput.from(dailyMenu)
  }
}
