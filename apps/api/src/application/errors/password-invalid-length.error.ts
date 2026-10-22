import { BusinessRuleError } from '@/application/errors/application-error'

export class PasswordInvalidLengthError extends BusinessRuleError {
  constructor(minLength: number, maxLength: number) {
    super(
      'user.invalid_password',
      `Password must have between ${minLength} and ${maxLength} characters`,
    )
  }
}
