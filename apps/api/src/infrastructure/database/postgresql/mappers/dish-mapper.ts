import { DishEntity } from '@/domain/entities/dish-entity'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { dishes } from '@/infrastructure/database/postgresql/schema'

type DishRow = typeof dishes.$inferSelect

export class DishMapper {
  static fromPersistence(row: DishRow): DishEntity {
    return restoreRecord('dishes', row.id, () =>
      DishEntity.restore({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        active: row.active,
      }),
    )
  }

  static toPersistence(dish: DishEntity): DishRow {
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description ?? null,
      active: dish.active,
    }
  }
}
