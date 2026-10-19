import { NotFoundError } from '@/application/errors/application-error'

export class AdjustmentNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('adjustment.not_found', `Adjustment ${id} was not found`)
  }
}
