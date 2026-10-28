import { ConflictError } from '@/application/errors/application-error'

export class UsernameTakenError extends ConflictError {
  constructor(username: string) {
    super('user.username_taken', `The username "${username}" is already taken`)
  }
}
