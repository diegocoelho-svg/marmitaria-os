import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { dailyMenuDishes, dailyMenus } from '@/infrastructure/database/postgresql/schema'

type DailyMenuRow = typeof dailyMenus.$inferSelect
type DailyMenuDishRow = typeof dailyMenuDishes.$inferSelect

export type DailyMenuRecord = DailyMenuRow & {
  dishes: DailyMenuDishRow[]
}

export type DailyMenuPersistence = {
  dailyMenu: DailyMenuRow
  dishes: DailyMenuDishRow[]
}

export class DailyMenuMapper {
  static fromPersistence(record: DailyMenuRecord): DailyMenuEntity {
    return restoreRecord('daily_menus', record.id, () =>
      DailyMenuEntity.restore({
        id: record.id,
        date: LocalDateVO.parse(record.date),
        sourceMenuId: record.sourceMenuId,
        dishIds: record.dishes.map((dish) => dish.dishId),
      }),
    )
  }

  static toPersistence(dailyMenu: DailyMenuEntity): DailyMenuPersistence {
    return {
      dailyMenu: {
        id: dailyMenu.id,
        date: dailyMenu.date.toString(),
        sourceMenuId: dailyMenu.sourceMenuId,
      },
      dishes: dailyMenu.dishIds.map((dishId, position) => ({
        dailyMenuId: dailyMenu.id,
        position,
        dishId,
      })),
    }
  }
}
