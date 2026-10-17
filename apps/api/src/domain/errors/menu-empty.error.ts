import { DomainError } from '@/domain/errors/domain-error'

export class MenuEmptyError extends DomainError {
  constructor() {
    super('menu.empty', 'A menu needs at least one dish')
  }
}
