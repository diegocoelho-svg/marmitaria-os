import type { DomainError } from '@/domain/errors/domain-error'

type TextError = new (maxLength: number) => DomainError

export function requiredText(value: string, maxLength: number, error: TextError): string {
  const text = value.trim()

  if (text.length === 0 || text.length > maxLength) {
    throw new error(maxLength)
  }

  return text
}

export function optionalText(
  value: string | undefined,
  maxLength: number,
  error: TextError,
): string | undefined {
  const text = value?.trim()

  if (!text) return undefined

  if (text.length > maxLength) {
    throw new error(maxLength)
  }

  return text
}
