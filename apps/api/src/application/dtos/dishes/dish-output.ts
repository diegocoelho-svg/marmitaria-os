import type { DishEntity } from '@/domain/entities/dish-entity'

export type DishOutput = {
  id: string
  name: string
  description: string | null
  active: boolean
}

export const DishOutput = {
  from(dish: DishEntity): DishOutput {
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description ?? null,
      active: dish.active,
    }
  },
}
