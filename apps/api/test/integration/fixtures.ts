import { randomUUID } from 'node:crypto'
import { DishEntity } from '@/domain/entities/dish-entity'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'

export async function seedDish(db: DrizzleExecutor, name: string): Promise<string> {
  const dish = DishEntity.create({ id: randomUUID(), name })
  await new PgDishRepository(db).create(dish)

  return dish.id
}

export function present<T>(value: T | null): T {
  if (value === null) {
    throw new Error('Expected a stored record')
  }

  return value
}

export function violates(constraint: string) {
  return { cause: { constraint } }
}
