import { UnauthenticatedError } from '@/application/errors/application-error'

export class SessionInvalidError extends UnauthenticatedError {
  constructor() {
    super('auth.unauthenticated', 'Sign in to continue')
  }
}
