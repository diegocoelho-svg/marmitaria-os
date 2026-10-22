import type { UserOutput } from '@/application/dtos/users/user-output'

export type LoginOutput = {
  token: string
  expiresAt: string
  user: UserOutput
}
