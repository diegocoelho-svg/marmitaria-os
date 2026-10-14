import { DomainError } from '../errors/domain-error'

export function requiredText(value: string, maxLength: number, code: string): string {
  const text = value.trim()

  if (text.length === 0 || text.length > maxLength) {
    throw new DomainError(code, `Text must have between 1 and ${maxLength} characters`)
  }

  return text
}

export function optionalText(
  value: string | undefined,
  maxLength: number,
  code: string,
): string | undefined {
  const text = value?.trim()

  if (!text) return undefined

  if (text.length > maxLength) {
    throw new DomainError(code, `Text must have at most ${maxLength} characters`)
  }

  return text
}
