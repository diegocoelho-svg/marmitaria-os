import type { LoginInput } from '@/application/dtos/auth/login-input'
import type { LoginOutput } from '@/application/dtos/auth/login-output'
import { UserOutput } from '@/application/dtos/users/user-output'
import { InvalidCredentialsError } from '@/application/errors/invalid-credentials.error'
import type { Clock } from '@/application/ports/clock'
import type { PasswordHasher } from '@/application/ports/password-hasher'
import type { SessionTokens } from '@/application/ports/session-tokens'
import { SessionEntity } from '@/domain/entities/session-entity'
import { UserEntity } from '@/domain/entities/user-entity'
import type { SessionRepository } from '@/domain/repositories/session-repository'
import type { UserRepository } from '@/domain/repositories/user-repository'

const DECOY_PASSWORD = 'decoy-password'

export class LoginUseCase {
  private readonly decoyHash: Promise<string>

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: SessionTokens,
    private readonly clock: Clock,
  ) {
    this.decoyHash = passwords.hash(DECOY_PASSWORD)
  }

  async execute(input: LoginInput): Promise<LoginOutput> {
    const decoyHash = await this.decoyHash
    const user = await this.users.findByUsername(UserEntity.normalizeUsername(input.username))
    const matches = await this.passwords.verify(input.password, user?.passwordHash ?? decoyHash)

    if (!user?.active || !matches) {
      throw new InvalidCredentialsError()
    }

    const { token, id } = this.tokens.issue()
    const session = SessionEntity.start({ id, userId: user.id, now: this.clock.now() })
    await this.sessions.create(session)

    return {
      token,
      expiresAt: session.expiresAt.toISOString(),
      user: UserOutput.from(user),
    }
  }
}
