import { DomainError } from '@/domain/errors/domain-error'

export class UserInvalidRoleError extends DomainError {
  constructor(value: string) {
    super('user.invalid_role', `Invalid user role: ${value}`)
  }
}
