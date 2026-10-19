import { DomainError } from '@/domain/errors/domain-error'

export class MenuArchivedError extends DomainError {
  constructor() {
    super('menu.archived', 'Menu is archived')
  }
}
