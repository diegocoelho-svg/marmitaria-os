import { NotFoundError } from '@/application/errors/application-error'

export class MenuNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('menu.not_found', `Menu ${id} was not found`)
  }
}
