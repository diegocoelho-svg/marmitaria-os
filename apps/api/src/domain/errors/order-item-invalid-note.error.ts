import { DomainError } from './domain-error'

export class OrderItemInvalidNoteError extends DomainError {
  constructor(maxLength: number) {
    super('order_item.invalid_note', `Note must have at most ${maxLength} characters`)
  }
}
