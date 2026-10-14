import { LocalDateInvalidError } from '../errors/local-date-invalid.error'
import { toTimestamp } from '../shared/instant'

export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export class LocalDateVO {
  private constructor(private readonly value: string) {
    Object.freeze(this)
  }

  static parse(value: string): LocalDateVO {
    const match = PATTERN.exec(value)
    const year = Number(match?.[1])
    const month = Number(match?.[2])
    const day = Number(match?.[3])

    if (!match || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      throw new LocalDateInvalidError(value)
    }

    return new LocalDateVO(value)
  }

  static fromInstant(instant: Date, timeZone = BUSINESS_TIME_ZONE): LocalDateVO {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(toTimestamp(instant))
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value ?? ''

    return LocalDateVO.parse(`${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`)
  }

  isBefore(other: LocalDateVO): boolean {
    return this.value < other.value
  }

  equals(other: LocalDateVO): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
