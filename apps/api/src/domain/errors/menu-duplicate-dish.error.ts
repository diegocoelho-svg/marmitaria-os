import { DomainError } from '@/domain/errors/domain-error'

export class MenuDuplicateDishError extends DomainError {
  constructor() {
    super('menu.duplicate_dish', 'A menu cannot repeat a dish')
  }
}
