import { DailyMenuOutput } from '@/application/dtos/daily-menus/daily-menu-output'
import { DailyMenuNotFoundError } from '@/application/errors/daily-menu-not-found.error'
import type { Clock } from '@/application/ports/clock'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class GetTodayDailyMenuUseCase {
  constructor(
    private readonly dailyMenus: DailyMenuRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<DailyMenuOutput> {
    const today = LocalDateVO.fromInstant(this.clock.now())
    const dailyMenu = await this.dailyMenus.findByDate(today)

    if (!dailyMenu) {
      throw new DailyMenuNotFoundError(today.toString())
    }

    return DailyMenuOutput.from(dailyMenu)
  }
}
