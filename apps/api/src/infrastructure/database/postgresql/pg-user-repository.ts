import { eq } from 'drizzle-orm'
import { UsernameTakenError } from '@/application/errors/username-taken.error'
import type { UserEntity } from '@/domain/entities/user-entity'
import type { UserRepository } from '@/domain/repositories/user-repository'
import type { DrizzleExecutor } from '@/infrastructure/database/postgresql/database'
import { violatesConstraint } from '@/infrastructure/database/postgresql/errors/constraint-violation'
import { UserMapper } from '@/infrastructure/database/postgresql/mappers/user-mapper'
import { users } from '@/infrastructure/database/postgresql/schema'

const USERNAME_UNIQUE = 'users_username_unique'

export class PgUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleExecutor) {}

  async findById(id: string): Promise<UserEntity | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id))

    return row ? UserMapper.fromPersistence(row) : null
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const [row] = await this.db.select().from(users).where(eq(users.username, username))

    return row ? UserMapper.fromPersistence(row) : null
  }

  async create(user: UserEntity): Promise<void> {
    try {
      await this.db.insert(users).values(UserMapper.toPersistence(user))
    } catch (error) {
      if (error instanceof Error && violatesConstraint(error, USERNAME_UNIQUE)) {
        throw new UsernameTakenError(user.username)
      }

      throw error
    }
  }
}
