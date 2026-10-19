import { ConflictError } from '@/application/errors/application-error'

export class DailyMenuDateTakenError extends ConflictError {
  constructor(date: string) {
    super('daily_menu.date_taken', `A daily menu for ${date} already exists`)
  }
}
