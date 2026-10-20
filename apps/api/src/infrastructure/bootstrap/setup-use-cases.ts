import type { Clock } from '@/application/ports/clock'
import type { EventBus } from '@/application/ports/event-bus'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { Repositories, UnitOfWork } from '@/application/ports/unit-of-work'
import { CreateAdjustmentUseCase } from '@/application/use-cases/adjustments/create-adjustment-use-case'
import { ListAdjustmentsUseCase } from '@/application/use-cases/adjustments/list-adjustments-use-case'
import { UpdateAdjustmentUseCase } from '@/application/use-cases/adjustments/update-adjustment-use-case'
import { ApplyMenuUseCase } from '@/application/use-cases/daily-menus/apply-menu-use-case'
import { GetDailyMenuUseCase } from '@/application/use-cases/daily-menus/get-daily-menu-use-case'
import { GetTodayDailyMenuUseCase } from '@/application/use-cases/daily-menus/get-today-daily-menu-use-case'
import { ListDailyMenusUseCase } from '@/application/use-cases/daily-menus/list-daily-menus-use-case'
import { SetDailyMenuDishesUseCase } from '@/application/use-cases/daily-menus/set-daily-menu-dishes-use-case'
import { CreateDishUseCase } from '@/application/use-cases/dishes/create-dish-use-case'
import { GetDishUseCase } from '@/application/use-cases/dishes/get-dish-use-case'
import { ListDishesUseCase } from '@/application/use-cases/dishes/list-dishes-use-case'
import { UpdateDishUseCase } from '@/application/use-cases/dishes/update-dish-use-case'
import { ArchiveMenuUseCase } from '@/application/use-cases/menus/archive-menu-use-case'
import { CreateMenuUseCase } from '@/application/use-cases/menus/create-menu-use-case'
import { GetMenuUseCase } from '@/application/use-cases/menus/get-menu-use-case'
import { ListMenusUseCase } from '@/application/use-cases/menus/list-menus-use-case'
import { UpdateMenuUseCase } from '@/application/use-cases/menus/update-menu-use-case'
import { ChangeOrderStatusUseCase } from '@/application/use-cases/orders/change-order-status-use-case'
import { CreateOrderUseCase } from '@/application/use-cases/orders/create-order-use-case'
import { GetOrderUseCase } from '@/application/use-cases/orders/get-order-use-case'
import { ChangeSizePriceUseCase } from '@/application/use-cases/size-prices/change-size-price-use-case'
import { ListSizePricesUseCase } from '@/application/use-cases/size-prices/list-size-prices-use-case'

export type UseCaseDependencies = {
  repositories: Repositories
  unitOfWork: UnitOfWork
  clock: Clock
  ids: IdGenerator
  eventBus: EventBus
}

export function setupUseCases({
  repositories,
  unitOfWork,
  clock,
  ids,
  eventBus,
}: UseCaseDependencies) {
  const { dishes, adjustments, sizePrices, menus, dailyMenus, orders } = repositories

  return {
    dishes: {
      list: new ListDishesUseCase(dishes),
      get: new GetDishUseCase(dishes),
      create: new CreateDishUseCase(dishes, ids),
      update: new UpdateDishUseCase(dishes),
    },
    adjustments: {
      list: new ListAdjustmentsUseCase(adjustments),
      create: new CreateAdjustmentUseCase(adjustments, ids),
      update: new UpdateAdjustmentUseCase(adjustments),
    },
    sizePrices: {
      list: new ListSizePricesUseCase(sizePrices),
      change: new ChangeSizePriceUseCase(unitOfWork, clock, ids),
    },
    menus: {
      list: new ListMenusUseCase(menus),
      get: new GetMenuUseCase(menus),
      create: new CreateMenuUseCase(menus, dishes, ids),
      update: new UpdateMenuUseCase(menus, dishes),
      archive: new ArchiveMenuUseCase(menus, clock),
    },
    dailyMenus: {
      list: new ListDailyMenusUseCase(dailyMenus),
      today: new GetTodayDailyMenuUseCase(dailyMenus, clock),
      get: new GetDailyMenuUseCase(dailyMenus),
      applyMenu: new ApplyMenuUseCase(dailyMenus, menus, dishes, clock, ids, eventBus),
      setDishes: new SetDailyMenuDishesUseCase(dailyMenus, dishes, clock, eventBus),
    },
    orders: {
      get: new GetOrderUseCase(orders),
      create: new CreateOrderUseCase(unitOfWork, clock, ids, eventBus),
      changeStatus: new ChangeOrderStatusUseCase(orders, clock, eventBus),
    },
  }
}

export type UseCases = ReturnType<typeof setupUseCases>
