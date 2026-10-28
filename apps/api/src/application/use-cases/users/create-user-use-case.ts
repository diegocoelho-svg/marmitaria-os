import type { CreateUserInput } from '@/application/dtos/users/create-user-input'
import { UserOutput } from '@/application/dtos/users/user-output'
import { PasswordInvalidLengthError } from '@/application/errors/password-invalid-length.error'
import { UsernameTakenError } from '@/application/errors/username-taken.error'
import type { IdGenerator } from '@/application/ports/id-generator'
import type { PasswordHasher } from '@/application/ports/password-hasher'
import { UserEntity } from '@/domain/entities/user-entity'
import type { UserRepository } from '@/domain/repositories/user-repository'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 256

export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    if (
      input.password.length < PASSWORD_MIN_LENGTH ||
      input.password.length > PASSWORD_MAX_LENGTH
    ) {
      throw new PasswordInvalidLengthError(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
    }

    const username = UserEntity.normalizeUsername(input.username)

    if (await this.users.findByUsername(username)) {
      throw new UsernameTakenError(username)
    }

    const user = UserEntity.create({
      id: this.ids.next(),
      username,
      name: input.name,
      role: input.role,
      passwordHash: await this.passwords.hash(input.password),
    })
    await this.users.create(user)

    return UserOutput.from(user)
  }
}
