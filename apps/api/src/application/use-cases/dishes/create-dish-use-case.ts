import type { CreateDishInput } from '@/application/dtos/dishes/create-dish-input'
import { DishOutput } from '@/application/dtos/dishes/dish-output'
import type { IdGenerator } from '@/application/ports/id-generator'
import { DishEntity } from '@/domain/entities/dish-entity'
import type { DishRepository } from '@/domain/repositories/dish-repository'

export class CreateDishUseCase {
  constructor(
    private readonly dishes: DishRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateDishInput): Promise<DishOutput> {
    const dish = DishEntity.create({
      id: this.ids.next(),
      name: input.name,
      description: input.description,
    })

    await this.dishes.create(dish)

    return DishOutput.from(dish)
  }
}
