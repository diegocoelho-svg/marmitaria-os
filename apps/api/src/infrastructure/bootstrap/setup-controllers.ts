import type { UseCases } from '@/infrastructure/bootstrap/setup-use-cases'
import { AdjustmentsController } from '@/infrastructure/http/controllers/adjustments.controller'
import { DailyMenusController } from '@/infrastructure/http/controllers/daily-menus.controller'
import { DishesController } from '@/infrastructure/http/controllers/dishes.controller'
import { EventsController } from '@/infrastructure/http/controllers/events.controller'
import { HealthController } from '@/infrastructure/http/controllers/health.controller'
import { MenusController } from '@/infrastructure/http/controllers/menus.controller'
import { OrdersController } from '@/infrastructure/http/controllers/orders.controller'
import { SizePricesController } from '@/infrastructure/http/controllers/size-prices.controller'
import type { EventStream } from '@/infrastructure/http/sse/event-stream'

export function setupControllers(
  { dishes, adjustments, sizePrices, menus, dailyMenus, orders }: UseCases,
  eventStream: EventStream,
): object[] {
  return [
    new HealthController(),
    new DishesController(dishes.list, dishes.get, dishes.create, dishes.update),
    new AdjustmentsController(adjustments.list, adjustments.create, adjustments.update),
    new SizePricesController(sizePrices.list, sizePrices.change),
    new MenusController(menus.list, menus.get, menus.create, menus.update, menus.archive),
    new DailyMenusController(
      dailyMenus.list,
      dailyMenus.today,
      dailyMenus.get,
      dailyMenus.applyMenu,
      dailyMenus.setDishes,
    ),
    new OrdersController(orders.list, orders.get, orders.create, orders.changeStatus),
    new EventsController(eventStream),
  ]
}
