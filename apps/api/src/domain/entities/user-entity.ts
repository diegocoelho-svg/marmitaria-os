import { UserInvalidNameError } from '@/domain/errors/user-invalid-name.error'
import { UserInvalidUsernameError } from '@/domain/errors/user-invalid-username.error'
import { Entity } from '@/domain/shared/entity'
import { requiredText } from '@/domain/shared/text'
import { assertUserRole, type UserRole } from '@/domain/value-objects/user-role'

const USERNAME = /^[a-z0-9._-]{3,32}$/
const NAME_MAX_LENGTH = 80

export type UserEntityProps = {
  readonly username: string
  name: string
  role: UserRole
  active: boolean
  passwordHash: string
}

export type CreateUserInput = {
  id: string
  username: string
  name: string
  role: UserRole
  passwordHash: string
}

export type RestoreUserInput = CreateUserInput & {
  active: boolean
}

export class UserEntity extends Entity<UserEntityProps> {
  private constructor(id: string, props: UserEntityProps) {
    const username = UserEntity.normalizeUsername(props.username)

    if (!USERNAME.test(username)) {
      throw new UserInvalidUsernameError()
    }

    super(id, {
      username,
      name: requiredText(props.name, NAME_MAX_LENGTH, UserInvalidNameError),
      role: assertUserRole(props.role),
      active: props.active,
      passwordHash: props.passwordHash,
    })
  }

  static create(input: CreateUserInput): UserEntity {
    return new UserEntity(input.id, { ...input, active: true })
  }

  static restore(input: RestoreUserInput): UserEntity {
    return new UserEntity(input.id, input)
  }

  static normalizeUsername(username: string): string {
    return username.trim().toLowerCase()
  }

  get username(): string {
    return this.props.username
  }

  get name(): string {
    return this.props.name
  }

  get role(): UserRole {
    return this.props.role
  }

  get active(): boolean {
    return this.props.active
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }
}
