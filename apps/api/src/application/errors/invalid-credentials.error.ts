import { UnauthenticatedError } from '@/application/errors/application-error'

export class InvalidCredentialsError extends UnauthenticatedError {
  constructor() {
    super('auth.invalid_credentials', 'Invalid username or password')
  }
}
