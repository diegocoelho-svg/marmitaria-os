import { ForbiddenError } from '@/application/errors/application-error'

export class AccessDeniedError extends ForbiddenError {
  constructor() {
    super('auth.forbidden', 'Your role does not allow this action')
  }
}
