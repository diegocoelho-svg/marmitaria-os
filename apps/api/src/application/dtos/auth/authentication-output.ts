import type { UserOutput } from '@/application/dtos/users/user-output'

export type AuthenticationOutput = {
  user: UserOutput
  renewedUntil: string | null
}
