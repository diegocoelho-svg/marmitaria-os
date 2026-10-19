import { DishOutput } from '@/application/dtos/dishes/dish-output'
import type { DishRepository } from '@/domain/repositories/dish-repository'

export class ListDishesUseCase {
  constructor(private readonly dishes: DishRepository) {}

  async execute(): Promise<DishOutput[]> {
    const dishes = await this.dishes.findAll()

    return dishes.map((dish) => DishOutput.from(dish))
  }
}
