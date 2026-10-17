import { MenuEntity } from '@/domain/entities/menu-entity'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { menuDishes, menus } from '@/infrastructure/database/postgresql/schema'

type MenuRow = typeof menus.$inferSelect
type MenuDishRow = typeof menuDishes.$inferSelect

export type MenuRecord = MenuRow & {
  dishes: MenuDishRow[]
}

export type MenuPersistence = {
  menu: MenuRow
  dishes: MenuDishRow[]
}

export class MenuMapper {
  static fromPersistence(record: MenuRecord): MenuEntity {
    return restoreRecord('menus', record.id, () =>
      MenuEntity.restore({
        id: record.id,
        name: record.name,
        dishIds: record.dishes.map((dish) => dish.dishId),
        archivedAt: record.archivedAt,
      }),
    )
  }

  static toPersistence(menu: MenuEntity): MenuPersistence {
    return {
      menu: {
        id: menu.id,
        name: menu.name,
        nameKey: menu.nameKey,
        archivedAt: menu.archivedAt,
      },
      dishes: menu.dishIds.map((dishId, position) => ({ menuId: menu.id, position, dishId })),
    }
  }
}
