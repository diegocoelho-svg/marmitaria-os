import { DishInvalidDescriptionError } from '@/domain/errors/dish-invalid-description.error'
import { DishInvalidNameError } from '@/domain/errors/dish-invalid-name.error'
import { Entity } from '@/domain/shared/entity'
import { optionalText, requiredText } from '@/domain/shared/text'

const NAME_MAX_LENGTH = 80
const DESCRIPTION_MAX_LENGTH = 280

export type DishEntityProps = {
  name: string
  description: string | undefined
  active: boolean
}

export type CreateDishInput = {
  id: string
  name: string
  description?: string | undefined
}

export type RestoreDishInput = CreateDishInput & {
  active: boolean
}

export class DishEntity extends Entity<DishEntityProps> {
  private constructor(id: string, props: DishEntityProps) {
    super(id, {
      name: requiredText(props.name, NAME_MAX_LENGTH, DishInvalidNameError),
      description: optionalText(
        props.description,
        DESCRIPTION_MAX_LENGTH,
        DishInvalidDescriptionError,
      ),
      active: props.active,
    })
  }

  static create(input: CreateDishInput): DishEntity {
    return new DishEntity(input.id, {
      name: input.name,
      description: input.description,
      active: true,
    })
  }

  static restore(input: RestoreDishInput): DishEntity {
    return new DishEntity(input.id, {
      name: input.name,
      description: input.description,
      active: input.active,
    })
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get active(): boolean {
    return this.props.active
  }

  rename(name: string): void {
    this.props.name = requiredText(name, NAME_MAX_LENGTH, DishInvalidNameError)
  }

  describe(description: string | undefined): void {
    this.props.description = optionalText(
      description,
      DESCRIPTION_MAX_LENGTH,
      DishInvalidDescriptionError,
    )
  }

  activate(): void {
    this.props.active = true
  }

  deactivate(): void {
    this.props.active = false
  }
}
