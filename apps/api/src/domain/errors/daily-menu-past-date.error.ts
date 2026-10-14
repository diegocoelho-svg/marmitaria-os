import { DomainError } from './domain-error'

export class DailyMenuPastDateError extends DomainError {
  constructor() {
    super('daily_menu.past_date', 'Past daily menus cannot be changed')
  }
}
