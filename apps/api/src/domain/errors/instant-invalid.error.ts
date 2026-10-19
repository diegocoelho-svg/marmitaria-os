import { DomainError } from '@/domain/errors/domain-error'

export class InstantInvalidError extends DomainError {
  constructor() {
    super('instant.invalid', 'Invalid instant')
  }
}
