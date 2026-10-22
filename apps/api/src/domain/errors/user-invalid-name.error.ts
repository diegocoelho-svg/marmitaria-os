import { DomainError } from '@/domain/errors/domain-error'

export class UserInvalidNameError extends DomainError {
  constructor(maxLength: number) {
    super('user.invalid_name', `User name must have between 1 and ${maxLength} characters`)
  }
}
