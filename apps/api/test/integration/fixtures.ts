import { randomUUID } from 'node:crypto'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { DishEntity } from '@/domain/entities/dish-entity'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { PgAdjustmentRepository } from '@/infrastructure/database/postgresql/pg-adjustment-repository'
import { PgDishRepository } from '@/infrastructure/database/postgresql/pg-dish-repository'

export async function seedDish(db: DrizzleExecutor, name: string): Promise<string> {
  const dish = DishEntity.create({ id: randomUUID(), name })
  await new PgDishRepository(db).create(dish)

  return dish.id
}

export async function seedAdjustment(db: DrizzleExecutor, label: string): Promise<string> {
  const adjustment = AdjustmentEntity.create({ id: randomUUID(), label })
  await new PgAdjustmentRepository(db).create(adjustment)

  return adjustment.id
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
