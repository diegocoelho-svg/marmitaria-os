import { UserEntity } from '@/domain/entities/user-entity'
import { restoreRecord } from '@/infrastructure/database/postgresql/errors/corrupted-record.error'
import type { users } from '@/infrastructure/database/postgresql/schema'

type UserRow = typeof users.$inferSelect

export class UserMapper {
  static fromPersistence(row: UserRow): UserEntity {
    return restoreRecord('users', row.id, () =>
      UserEntity.restore({
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        active: row.active,
        passwordHash: row.passwordHash,
      }),
    )
  }

  static toPersistence(user: UserEntity): UserRow {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      active: user.active,
      passwordHash: user.passwordHash,
    }
  }
}
