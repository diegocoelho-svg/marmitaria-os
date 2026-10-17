import type { DishEntity } from '@/domain/entities/dish-entity'

export interface DishRepository {
  findById(id: string): Promise<DishEntity | null>
  findByIds(ids: readonly string[]): Promise<DishEntity[]>
  findAll(): Promise<DishEntity[]>
  create(dish: DishEntity): Promise<void>
  update(dish: DishEntity): Promise<void>
}
