import { ConflictError } from '@/application/errors/application-error'

export class MenuNameTakenError extends ConflictError {
  constructor(name: string) {
    super('menu.name_taken', `An active menu named "${name}" already exists`)
  }
}
