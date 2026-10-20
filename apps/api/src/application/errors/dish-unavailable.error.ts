import { BusinessRuleError } from '@/application/errors/application-error'

export class DishUnavailableError extends BusinessRuleError {
  constructor(ids: readonly string[]) {
    super('dish.unavailable', `Dishes ${ids.join(', ')} do not exist or are inactive`)
  }
}
