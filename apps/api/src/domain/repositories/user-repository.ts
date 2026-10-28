import type { UserEntity } from '@/domain/entities/user-entity'

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByUsername(username: string): Promise<UserEntity | null>
  create(user: UserEntity): Promise<void>
}
