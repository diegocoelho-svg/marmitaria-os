import { DomainError } from '../errors/domain-error'

export const sizes = ['small', 'medium', 'large'] as const

export type Size = (typeof sizes)[number]

export function isSize(value: string): value is Size {
  return sizes.some((size) => size === value)
}

export function assertSize(value: string): Size {
  if (!isSize(value)) {
    throw new DomainError('size.invalid', `Invalid size: ${value}`)
  }

  return value
}
