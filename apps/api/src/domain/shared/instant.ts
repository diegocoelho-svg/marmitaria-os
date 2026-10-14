import { DomainError } from '../errors/domain-error'

export function toTimestamp(instant: Date): number {
  const timestamp = instant.getTime()

  if (Number.isNaN(timestamp)) {
    throw new DomainError('instant.invalid', 'Invalid instant')
  }

  return timestamp
}
