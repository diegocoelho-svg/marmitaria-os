import { DomainError } from '@/domain/errors/domain-error'

export class DishInvalidNameError extends DomainError {
  constructor(maxLength: number) {
    super('dish.invalid_name', `Dish name must have between 1 and ${maxLength} characters`)
  }
}
