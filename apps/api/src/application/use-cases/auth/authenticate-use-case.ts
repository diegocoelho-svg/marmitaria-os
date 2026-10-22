import type { AuthenticationOutput } from '@/application/dtos/auth/authentication-output'
import type { SessionTokenInput } from '@/application/dtos/auth/session-token-input'
import { UserOutput } from '@/application/dtos/users/user-output'
import { SessionInvalidError } from '@/application/errors/session-invalid.error'
import type { Clock } from '@/application/ports/clock'
import type { SessionTokens } from '@/application/ports/session-tokens'
import type { SessionRepository } from '@/domain/repositories/session-repository'
import type { UserRepository } from '@/domain/repositories/user-repository'

export class AuthenticateUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly tokens: SessionTokens,
    private readonly clock: Clock,
  ) {}

  async execute(input: SessionTokenInput): Promise<AuthenticationOutput> {
    const now = this.clock.now()
    const session = await this.sessions.findById(this.tokens.idOf(input.token))

    if (!session) {
      throw new SessionInvalidError()
    }

    if (session.isExpiredAt(now)) {
      await this.sessions.delete(session.id)
      throw new SessionInvalidError()
    }

    const user = await this.users.findById(session.userId)

    if (!user?.active) {
      throw new SessionInvalidError()
    }

    if (!session.needsRenewalAt(now)) {
      return { user: UserOutput.from(user), renewedUntil: null }
    }

    const previousExpiry = session.expiresAt
    session.renew(now)
    const renewed = await this.sessions.renew(session, previousExpiry)

    return {
      user: UserOutput.from(user),
      renewedUntil: renewed ? session.expiresAt.toISOString() : null,
    }
  }
}
