import { BusinessRuleError } from '@/application/errors/application-error'

export class OrderWithoutDailyMenuError extends BusinessRuleError {
  constructor(date: string) {
    super('order.no_daily_menu', `There is no daily menu for ${date} to take orders from`)
  }
}
