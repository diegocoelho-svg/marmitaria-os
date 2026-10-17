import { asc, eq, inArray } from 'drizzle-orm'
import type { DishEntity } from '@/domain/entities/dish-entity'
import type { DishRepository } from '@/domain/repositories/dish-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { DishMapper } from '@/infrastructure/database/postgresql/mappers/dish-mapper'
import { dishes } from '@/infrastructure/database/postgresql/schema'

export class PgDishRepository implements DishRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<DishEntity | null> {
    const [row] = await this.db.select().from(dishes).where(eq(dishes.id, id))

    return row ? DishMapper.fromPersistence(row) : null
  }

  async findByIds(ids: readonly string[]): Promise<DishEntity[]> {
    if (ids.length === 0) return []

    const rows = await this.db
      .select()
      .from(dishes)
      .where(inArray(dishes.id, [...ids]))

    return rows.map((row) => DishMapper.fromPersistence(row))
  }

  async findAll(): Promise<DishEntity[]> {
    const rows = await this.db.select().from(dishes).orderBy(asc(dishes.name), asc(dishes.id))

    return rows.map((row) => DishMapper.fromPersistence(row))
  }

  async create(dish: DishEntity): Promise<void> {
    await this.db.insert(dishes).values(DishMapper.toPersistence(dish))
  }

  async update(dish: DishEntity): Promise<void> {
    const { id, ...row } = DishMapper.toPersistence(dish)

    await this.db.update(dishes).set(row).where(eq(dishes.id, id))
  }
}
