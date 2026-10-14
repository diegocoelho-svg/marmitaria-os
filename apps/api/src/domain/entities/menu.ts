import { DomainError } from '../errors/domain-error'
import { toTimestamp } from '../shared/instant'
import { requiredText } from '../shared/text'
import { dishSelection } from '../shared/dish-selection'

const NAME_MAX_LENGTH = 60

type CreateMenuInput = {
  id: string
  name: string
  dishIds: readonly string[]
}

type MenuProps = CreateMenuInput & {
  archivedAt: Date | null
}

export class Menu {
  #name: string
  #dishIds: string[]
  #archivedAt: number | null

  private constructor(
    readonly id: string,
    name: string,
    dishIds: readonly string[],
    archivedAt: Date | null,
  ) {
    this.#name = requiredText(name, NAME_MAX_LENGTH, 'menu.invalid_name')
    this.#dishIds = dishSelection(dishIds)
    this.#archivedAt = archivedAt === null ? null : toTimestamp(archivedAt)
  }

  static create(input: CreateMenuInput): Menu {
    return new Menu(input.id, input.name, input.dishIds, null)
  }

  static restore(props: MenuProps): Menu {
    return new Menu(props.id, props.name, props.dishIds, props.archivedAt)
  }

  get name(): string {
    return this.#name
  }

  get nameKey(): string {
    return this.#name.normalize('NFC').toLowerCase()
  }

  get dishIds(): readonly string[] {
    return [...this.#dishIds]
  }

  get archivedAt(): Date | null {
    return this.#archivedAt === null ? null : new Date(this.#archivedAt)
  }

  get isArchived(): boolean {
    return this.#archivedAt !== null
  }

  rename(name: string): void {
    this.assertActive()
    this.#name = requiredText(name, NAME_MAX_LENGTH, 'menu.invalid_name')
  }

  setDishes(dishIds: readonly string[]): void {
    this.assertActive()
    this.#dishIds = dishSelection(dishIds)
  }

  archive(now: Date): void {
    const archivedAt = toTimestamp(now)

    this.#archivedAt ??= archivedAt
  }

  private assertActive(): void {
    if (this.isArchived) {
      throw new DomainError('menu.archived', 'Menu is archived')
    }
  }
}
