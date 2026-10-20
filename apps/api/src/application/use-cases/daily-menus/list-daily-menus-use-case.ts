import { DailyMenuOutput } from '@/application/dtos/daily-menus/daily-menu-output'
import type { ListDailyMenusInput } from '@/application/dtos/daily-menus/list-daily-menus-input'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'

export class ListDailyMenusUseCase {
  constructor(private readonly dailyMenus: DailyMenuRepository) {}

  async execute(input: ListDailyMenusInput): Promise<DailyMenuOutput[]> {
    const dailyMenus = await this.dailyMenus.findBetween(
      LocalDateVO.parse(input.from),
      LocalDateVO.parse(input.to),
    )

    return dailyMenus.map((dailyMenu) => DailyMenuOutput.from(dailyMenu))
  }
}
