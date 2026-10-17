import { DomainError } from '@/domain/errors/domain-error'

export class OrderItemInvalidDishNameError extends DomainError {
  constructor(maxLength: number) {
    super(
      'order_item.invalid_dish_name',
      `Dish name must have between 1 and ${maxLength} characters`,
    )
  }
}
