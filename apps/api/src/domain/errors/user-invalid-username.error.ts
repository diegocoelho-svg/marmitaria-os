import { DomainError } from '@/domain/errors/domain-error'

export class UserInvalidUsernameError extends DomainError {
  constructor() {
    super(
      'user.invalid_username',
      'Username must have between 3 and 32 characters among letters, digits, ".", "_" and "-"',
    )
  }
}
