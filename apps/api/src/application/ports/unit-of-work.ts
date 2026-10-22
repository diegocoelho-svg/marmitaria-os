import type { AdjustmentRepository } from '@/domain/repositories/adjustment-repository'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { MenuRepository } from '@/domain/repositories/menu-repository'
import type { OrderRepository } from '@/domain/repositories/order-repository'
import type { SessionRepository } from '@/domain/repositories/session-repository'
import type { SizePriceRepository } from '@/domain/repositories/size-price-repository'
import type { TicketCounterRepository } from '@/domain/repositories/ticket-counter-repository'
import type { UserRepository } from '@/domain/repositories/user-repository'

export type Repositories = {
  dishes: DishRepository
  adjustments: AdjustmentRepository
  sizePrices: SizePriceRepository
  menus: MenuRepository
  dailyMenus: DailyMenuRepository
  orders: OrderRepository
  tickets: TicketCounterRepository
  users: UserRepository
  sessions: SessionRepository
}

export interface UnitOfWork {
  run<T>(work: (repositories: Repositories) => Promise<T>): Promise<T>
}
