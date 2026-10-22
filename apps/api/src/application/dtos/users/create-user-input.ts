import type { UserRole } from '@/domain/value-objects/user-role'

export type CreateUserInput = {
  username: string
  name: string
  role: UserRole
  password: string
}
