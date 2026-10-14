import { DomainError } from '../errors/domain-error'

export class TicketNumber {
  private constructor(readonly value: number) {
    Object.freeze(this)
  }

  static of(value: number): TicketNumber {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new DomainError('ticket_number.invalid', `Invalid ticket number: ${value}`)
    }

    return new TicketNumber(value)
  }

  format(): string {
    return String(this.value).padStart(3, '0')
  }

  equals(other: TicketNumber): boolean {
    return this.value === other.value
  }
}
