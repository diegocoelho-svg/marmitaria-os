import { NotFoundError } from '@/application/errors/application-error'

export class OrderNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('order.not_found', `Order ${id} was not found`)
  }
}
