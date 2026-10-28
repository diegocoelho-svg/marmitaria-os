import { SizeInvalidError } from '@/domain/errors/size-invalid.error'

export const sizes: readonly ['small', 'medium', 'large'] = ['small', 'medium', 'large']

export type Size = (typeof sizes)[number]

export function isSize(value: string): value is Size {
  return sizes.some((size) => size === value)
}

export function assertSize(value: string): Size {
  if (!isSize(value)) {
    throw new SizeInvalidError(value)
  }

  return value
}
