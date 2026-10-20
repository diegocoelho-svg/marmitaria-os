import { BusinessRuleError } from '@/application/errors/application-error'

export class OrderSizeNotPricedError extends BusinessRuleError {
  constructor(size: string) {
    super('order.size_not_priced', `Size ${size} has no current price`)
  }
}
