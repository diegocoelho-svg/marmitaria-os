import { TicketNumberInvalidError } from '../errors/ticket-number-invalid.error'

export class TicketNumberVO {
  private constructor(readonly value: number) {
    Object.freeze(this)
  }

  static of(value: number): TicketNumberVO {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TicketNumberInvalidError(value)
    }

    return new TicketNumberVO(value)
  }

  format(): string {
    return String(this.value).padStart(3, '0')
  }

  equals(other: TicketNumberVO): boolean {
    return this.value === other.value
  }
}
