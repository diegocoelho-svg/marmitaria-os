import type { UserEntity } from '@/domain/entities/user-entity'
import type { UserRole } from '@/domain/value-objects/user-role'

export type UserOutput = {
  id: string
  username: string
  name: string
  role: UserRole
}

export const UserOutput = {
  from(user: UserEntity): UserOutput {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }
  },
}
