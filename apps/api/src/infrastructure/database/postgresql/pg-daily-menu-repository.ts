import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { DailyMenuDateTakenError } from '@/application/errors/daily-menu-date-taken.error'
import type { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import type { DailyMenuRepository } from '@/domain/repositories/daily-menu-repository'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { violatesConstraint } from '@/infrastructure/database/postgresql/errors/constraint-violation'
import { DailyMenuMapper } from '@/infrastructure/database/postgresql/mappers/daily-menu-mapper'
import { dailyMenuDishes, dailyMenus } from '@/infrastructure/database/postgresql/schema'

const DATE_UNIQUE = 'daily_menus_date_unique'

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

  async findBetween(from: LocalDateVO, to: LocalDateVO): Promise<DailyMenuEntity[]> {
    const records = await this.db.query.dailyMenus.findMany({
      where: and(gte(dailyMenus.date, from.toString()), lte(dailyMenus.date, to.toString())),
      orderBy: asc(dailyMenus.date),
      with: { dishes: { orderBy: asc(dailyMenuDishes.position) } },
    })

    return records.map((record) => DailyMenuMapper.fromPersistence(record))
  }

  async create(dailyMenu: DailyMenuEntity): Promise<void> {
    const persistence = DailyMenuMapper.toPersistence(dailyMenu)

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(dailyMenus).values(persistence.dailyMenu)
        await tx.insert(dailyMenuDishes).values(persistence.dishes)
      })
    } catch (error) {
      if (error instanceof Error && violatesConstraint(error, DATE_UNIQUE)) {
        throw new DailyMenuDateTakenError(dailyMenu.date.toString())
      }

      throw error
    }
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
