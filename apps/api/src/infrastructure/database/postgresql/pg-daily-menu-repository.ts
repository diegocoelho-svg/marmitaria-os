import { asc, eq } from 'drizzle-orm'
import type { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { DailyMenuMapper } from '@/infrastructure/database/postgresql/mappers/daily-menu-mapper'
import { dailyMenuDishes, dailyMenus } from '@/infrastructure/database/postgresql/schema'

export class PgDailyMenuRepository implements DailyMenuRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<DailyMenuEntity | null> {
    const record = await this.db.query.dailyMenus.findFirst({
      where: eq(dailyMenus.id, id),
      with: { dishes: { orderBy: asc(dailyMenuDishes.position) } },
    })

    return record ? DailyMenuMapper.fromPersistence(record) : null
  }

  async findByDate(date: LocalDateVO): Promise<DailyMenuEntity | null> {
    const record = await this.db.query.dailyMenus.findFirst({
      where: eq(dailyMenus.date, date.toString()),
      with: { dishes: { orderBy: asc(dailyMenuDishes.position) } },
    })

    return record ? DailyMenuMapper.fromPersistence(record) : null
  }

  async create(dailyMenu: DailyMenuEntity): Promise<void> {
    const persistence = DailyMenuMapper.toPersistence(dailyMenu)

    await this.db.transaction(async (tx) => {
      await tx.insert(dailyMenus).values(persistence.dailyMenu)
      await tx.insert(dailyMenuDishes).values(persistence.dishes)
    })
  }

  async update(dailyMenu: DailyMenuEntity): Promise<void> {
    const { dailyMenu: row, dishes } = DailyMenuMapper.toPersistence(dailyMenu)

    await this.db.transaction(async (tx) => {
      await tx
        .update(dailyMenus)
        .set({ sourceMenuId: row.sourceMenuId })
        .where(eq(dailyMenus.id, row.id))
      await tx.delete(dailyMenuDishes).where(eq(dailyMenuDishes.dailyMenuId, row.id))
      await tx.insert(dailyMenuDishes).values(dishes)
    })
  }
}
