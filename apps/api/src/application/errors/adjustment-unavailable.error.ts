import { BusinessRuleError } from '@/application/errors/application-error'

export class AdjustmentUnavailableError extends BusinessRuleError {
  constructor(ids: readonly string[]) {
    super('adjustment.unavailable', `Adjustments ${ids.join(', ')} do not exist or are inactive`)
  }
}
