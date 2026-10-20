import { NotFoundError } from '@/application/errors/application-error'

export class DailyMenuNotFoundError extends NotFoundError {
  constructor(date: string) {
    super('daily_menu.not_found', `There is no daily menu for ${date}`)
  }
}
