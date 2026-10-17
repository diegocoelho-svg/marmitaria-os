import { MenuArchivedError } from '@/domain/errors/menu-archived.error'
import { MenuInvalidNameError } from '@/domain/errors/menu-invalid-name.error'
import { Entity } from '@/domain/shared/entity'
import { copyInstant } from '@/domain/shared/instant'
import { requiredText } from '@/domain/shared/text'
import { DishSelectionVO } from '@/domain/value-objects/dish-selection-vo'

const NAME_MAX_LENGTH = 60

export type MenuEntityProps = {
  name: string
  dishes: DishSelectionVO
  archivedAt: Date | null
}

export type CreateMenuInput = {
  id: string
  name: string
  dishIds: readonly string[]
}

export type RestoreMenuInput = CreateMenuInput & {
  archivedAt: Date | null
}

export class MenuEntity extends Entity<MenuEntityProps> {
  private constructor(
    id: string,
    name: string,
    dishIds: readonly string[],
    archivedAt: Date | null,
  ) {
    super(id, {
      name: requiredText(name, NAME_MAX_LENGTH, MenuInvalidNameError),
      dishes: DishSelectionVO.of(dishIds),
      archivedAt: archivedAt === null ? null : copyInstant(archivedAt),
    })
  }

  static create(input: CreateMenuInput): MenuEntity {
    return new MenuEntity(input.id, input.name, input.dishIds, null)
  }

  static restore(input: RestoreMenuInput): MenuEntity {
    return new MenuEntity(input.id, input.name, input.dishIds, input.archivedAt)
  }

  get name(): string {
    return this.props.name
  }

  get nameKey(): string {
    return this.props.name.normalize('NFC').toLowerCase()
  }

  get dishes(): DishSelectionVO {
    return this.props.dishes
  }

  get dishIds(): readonly string[] {
    return this.props.dishes.dishIds
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt === null ? null : new Date(this.props.archivedAt)
  }

  get isArchived(): boolean {
    return this.props.archivedAt !== null
  }

  rename(name: string): void {
    this.assertActive()
    this.props.name = requiredText(name, NAME_MAX_LENGTH, MenuInvalidNameError)
  }

  setDishes(dishIds: readonly string[]): void {
    this.assertActive()
    this.props.dishes = DishSelectionVO.of(dishIds)
  }

  archive(now: Date): void {
    const archivedAt = copyInstant(now)

    this.props.archivedAt ??= archivedAt
  }

  private assertActive(): void {
    if (this.isArchived) {
      throw new MenuArchivedError()
    }
  }
}
