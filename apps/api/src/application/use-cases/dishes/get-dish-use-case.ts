import { DishOutput } from '@/application/dtos/dishes/dish-output'
import { DishNotFoundError } from '@/application/errors/dish-not-found.error'
import type { DishRepository } from '@/domain/repositories/dish-repository'

export class GetDishUseCase {
  constructor(private readonly dishes: DishRepository) {}

  async execute(input: { id: string }): Promise<DishOutput> {
    const dish = await this.dishes.findById(input.id)

    if (!dish) {
      throw new DishNotFoundError(input.id)
    }

    return DishOutput.from(dish)
  }
}
