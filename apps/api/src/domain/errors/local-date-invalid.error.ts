import { DomainError } from '@/domain/errors/domain-error'

export class LocalDateInvalidError extends DomainError {
  constructor(value: string) {
    super('local_date.invalid', `Invalid local date: ${value}`)
  }
}
