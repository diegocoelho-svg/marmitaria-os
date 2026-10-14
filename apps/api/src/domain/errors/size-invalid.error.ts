import { DomainError } from './domain-error'

export class SizeInvalidError extends DomainError {
  constructor(value: string) {
    super('size.invalid', `Invalid size: ${value}`)
  }
}
