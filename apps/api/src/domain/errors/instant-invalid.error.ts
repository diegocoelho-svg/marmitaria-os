import { DomainError } from './domain-error'

export class InstantInvalidError extends DomainError {
  constructor() {
    super('instant.invalid', 'Invalid instant')
  }
}
