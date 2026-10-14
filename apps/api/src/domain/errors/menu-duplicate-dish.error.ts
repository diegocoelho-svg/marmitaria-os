import { DomainError } from './domain-error'

export class MenuDuplicateDishError extends DomainError {
  constructor() {
    super('menu.duplicate_dish', 'A menu cannot repeat a dish')
  }
}
