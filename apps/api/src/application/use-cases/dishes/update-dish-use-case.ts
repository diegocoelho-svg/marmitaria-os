import { DishOutput } from '@/application/dtos/dishes/dish-output'
import type { UpdateDishInput } from '@/application/dtos/dishes/update-dish-input'
import { DishNotFoundError } from '@/application/errors/dish-not-found.error'
import type { DishRepository } from '@/domain/repositories/dish-repository'

export class UpdateDishUseCase {
  constructor(private readonly dishes: DishRepository) {}

  async execute(input: UpdateDishInput): Promise<DishOutput> {
    const dish = await this.dishes.findById(input.id)

    if (!dish) {
      throw new DishNotFoundError(input.id)
    }

    if (input.name !== undefined) {
      dish.rename(input.name)
    }

    if (input.description !== undefined) {
      dish.describe(input.description ?? undefined)
    }

    if (input.active === true) {
      dish.activate()
    } else if (input.active === false) {
      dish.deactivate()
    }

    await this.dishes.update(dish)

    return DishOutput.from(dish)
  }
}
