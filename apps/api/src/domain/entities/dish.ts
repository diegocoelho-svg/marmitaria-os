import { optionalText, requiredText } from '../shared/text'

const NAME_MAX_LENGTH = 80
const DESCRIPTION_MAX_LENGTH = 280

type CreateDishInput = {
  id: string
  name: string
  description?: string | undefined
}

type DishProps = CreateDishInput & {
  active: boolean
}

export class Dish {
  #name: string
  #description: string | undefined
  #active: boolean

  private constructor(
    readonly id: string,
    name: string,
    description: string | undefined,
    active: boolean,
  ) {
    this.#name = requiredText(name, NAME_MAX_LENGTH, 'dish.invalid_name')
    this.#description = optionalText(
      description,
      DESCRIPTION_MAX_LENGTH,
      'dish.invalid_description',
    )
    this.#active = active
  }

  static create(input: CreateDishInput): Dish {
    return new Dish(input.id, input.name, input.description, true)
  }

  static restore(props: DishProps): Dish {
    return new Dish(props.id, props.name, props.description, props.active)
  }

  get name(): string {
    return this.#name
  }

  get description(): string | undefined {
    return this.#description
  }

  get active(): boolean {
    return this.#active
  }

  rename(name: string): void {
    this.#name = requiredText(name, NAME_MAX_LENGTH, 'dish.invalid_name')
  }

  describe(description: string | undefined): void {
    this.#description = optionalText(
      description,
      DESCRIPTION_MAX_LENGTH,
      'dish.invalid_description',
    )
  }

  activate(): void {
    this.#active = true
  }

  deactivate(): void {
    this.#active = false
  }
}
