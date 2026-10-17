import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'
import type { OrderRepository } from '@/domain/repositories/order-repository'
import type { SizePriceRepository } from '@/domain/repositories/size-price-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { PgDailyMenuRepository } from '@/infrastructure/database/postgresql/pg-daily-menu-repository'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'
import { PgMenuRepository } from '@/infrastructure/database/postgresql/pg-menu-repository'
import { PgOrderRepository } from '@/infrastructure/database/postgresql/pg-order-repository'
import { PgSizePriceRepository } from '@/infrastructure/database/postgresql/pg-size-price-repository'

export type Repositories = {
  dishes: DishRepository
  sizePrices: SizePriceRepository
  menus: MenuRepository
  dailyMenus: DailyMenuRepository
  orders: OrderRepository
}

export function setupRepositories(db: DrizzleExecutor): Repositories {
  return {
    dishes: new PgDishRepository(db),
    sizePrices: new PgSizePriceRepository(db),
    menus: new PgMenuRepository(db),
    dailyMenus: new PgDailyMenuRepository(db),
    orders: new PgOrderRepository(db),
  }
}
