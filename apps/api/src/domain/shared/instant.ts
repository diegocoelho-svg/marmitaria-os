import { InstantInvalidError } from '@/domain/errors/instant-invalid.error'

export function toTimestamp(instant: Date): number {
  const timestamp = instant.getTime()

  if (Number.isNaN(timestamp)) {
    throw new InstantInvalidError()
  }

  return timestamp
}

export function copyInstant(instant: Date): Date {
  return new Date(toTimestamp(instant))
}
