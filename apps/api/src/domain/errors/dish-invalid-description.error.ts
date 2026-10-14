import { DomainError } from './domain-error'

export class DishInvalidDescriptionError extends DomainError {
  constructor(maxLength: number) {
    super('dish.invalid_description', `Dish description must have at most ${maxLength} characters`)
  }
}
