import { NotFoundError } from '@/application/errors/application-error'

export class DishNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('dish.not_found', `Dish ${id} was not found`)
  }
}
