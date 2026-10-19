import { DomainError } from '@/domain/errors/domain-error'

export class StaleWriteError extends DomainError {
  constructor(aggregate: string, id: string) {
    super('stale_write', `${aggregate} ${id} was changed by another operation`)
  }
}
