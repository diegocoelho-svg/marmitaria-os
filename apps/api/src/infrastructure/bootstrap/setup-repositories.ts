import type { Repositories } from '@/application/ports/unit-of-work'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { PgAdjustmentRepository } from '@/infrastructure/database/postgresql/pg-adjustment-repository'
import { PgDailyMenuRepository } from '@/infrastructure/database/postgresql/pg-daily-menu-repository'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'
import { PgMenuRepository } from '@/infrastructure/database/postgresql/pg-menu-repository'
import { PgOrderRepository } from '@/infrastructure/database/postgresql/pg-order-repository'
import { PgSessionRepository } from '@/infrastructure/database/postgresql/pg-session-repository'
import { PgSizePriceRepository } from '@/infrastructure/database/postgresql/pg-size-price-repository'
import { PgTicketCounterRepository } from '@/infrastructure/database/postgresql/pg-ticket-counter-repository'
import { PgUserRepository } from '@/infrastructure/database/postgresql/pg-user-repository'

export function setupRepositories(db: DrizzleExecutor): Repositories {
  return {
    dishes: new PgDishRepository(db),
    adjustments: new PgAdjustmentRepository(db),
    sizePrices: new PgSizePriceRepository(db),
    menus: new PgMenuRepository(db),
    dailyMenus: new PgDailyMenuRepository(db),
    orders: new PgOrderRepository(db),
    tickets: new PgTicketCounterRepository(db),
    users: new PgUserRepository(db),
    sessions: new PgSessionRepository(db),
  }
}
