import { DomainError } from './domain-error'

export class TicketNumberInvalidError extends DomainError {
  constructor(value: number) {
    super('ticket_number.invalid', `Invalid ticket number: ${value}`)
  }
}
