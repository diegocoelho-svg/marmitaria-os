import { DomainError } from '@/domain/errors/domain-error'

export class AdjustmentInvalidLabelError extends DomainError {
  constructor(maxLength: number) {
    super(
      'adjustment.invalid_label',
      `Adjustment label must have between 1 and ${maxLength} characters`,
    )
  }
}
