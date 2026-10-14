import { DomainError } from './domain-error'

export class MenuInvalidNameError extends DomainError {
  constructor(maxLength: number) {
    super('menu.invalid_name', `Menu name must have between 1 and ${maxLength} characters`)
  }
}
