import { DailyMenuOutput } from '@/application/dtos/daily-menus/daily-menu-output'
import { DailyMenuNotFoundError } from '@/application/errors/daily-menu-not-found.error'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class GetDailyMenuUseCase {
  constructor(private readonly dailyMenus: DailyMenuRepository) {}

  async execute(input: { date: string }): Promise<DailyMenuOutput> {
    const dailyMenu = await this.dailyMenus.findByDate(LocalDateVO.parse(input.date))

    if (!dailyMenu) {
      throw new DailyMenuNotFoundError(input.date)
    }

    return DailyMenuOutput.from(dailyMenu)
  }
}
