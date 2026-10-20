import { BusinessRuleError } from '@/application/errors/application-error'

export class OrderDishUnavailableError extends BusinessRuleError {
  constructor(ids: readonly string[]) {
    super('order.dish_unavailable', `Dishes ${ids.join(', ')} are not available today`)
  }
}
